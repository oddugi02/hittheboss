'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame, ThreeEvent } from '@react-three/fiber';
import {
  RigidBody,
  RapierRigidBody,
  BallCollider,
  CuboidCollider,
  useSphericalJoint,
  useRevoluteJoint,
  interactionGroups,
} from '@react-three/rapier';
import { useGameStore } from '../store/gameStore';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { playPainSound } from '../utils/sounds';
import {
  HatMesh,
  EyebrowsMesh,
  MouthMesh,
  NoseMesh,
  FaceAccessoryMesh,
  FacialHairMesh,
  OutfitMesh,
  bodyScale,
  heightScale,
} from './BossParts';

// ── Drag context ──
const dragState = {
  body: null as RapierRigidBody | null,
  plane: new THREE.Plane(),
  offset: new THREE.Vector3(),
  isPointerDown: false,
};

// Safely read a vector-returning method on a rapier RigidBody. If the underlying
// wasm handle has been disposed (e.g. boss key changed → component remount),
// rapier throws a "null pointer passed to rust" error. We swallow it and signal
// the caller so they can drop the stale reference.
function safeBodyVec3<T extends RapierRigidBody, K extends 'translation' | 'linvel'>(
  body: T,
  method: K,
): { x: number; y: number; z: number } | null {
  try {
    return body[method]();
  } catch {
    return null;
  }
}

function safeBodyRotation(body: RapierRigidBody): { x: number; y: number; z: number; w: number } | null {
  try {
    return body.rotation();
  } catch {
    return null;
  }
}

function it_lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function Boss() {
  const torsoRef = useRef<RapierRigidBody>(null);
  const headRef = useRef<RapierRigidBody>(null);
  const leftArmRef = useRef<RapierRigidBody>(null);
  const rightArmRef = useRef<RapierRigidBody>(null);
  const leftLegRef = useRef<RapierRigidBody>(null);
  const rightLegRef = useRef<RapierRigidBody>(null);

  // Whole-body group used by the crit flash effect to tint every visible mesh.
  const bodyGroupRef = useRef<THREE.Group>(null);

  const { camera } = useThree();
  const setIsDragging = useGameStore((s) => s.setIsDragging);
  const appearance = useGameStore((s) => s.appearance);
  const decayRecentDamage = useGameStore((s) => s.decayRecentDamage);
  const damageLevel = useGameStore((s) => s.damageLevel);

  // ── Critical hit flash ──
  // We listen to lastCritAt as a wall-clock timestamp from the store and
  // convert to performance.now() locally so the animation ramp matches the
  // request timestamp (avoids drift between Date.now and performance.now).
  const critStartedAtRef = useRef(0);
  const lastEmissiveRef = useRef(0);
  const cachedMaterialsRef = useRef<{
    mat: THREE.MeshStandardMaterial;
    origR: number;
    origG: number;
    origB: number;
  }[]>([]);

  // Subscribe imperatively so we don't trigger React re-renders on every crit.
  useEffect(() => {
    const unsub = useGameStore.subscribe((state, prev) => {
      if (state.lastCritAt && state.lastCritAt !== prev.lastCritAt) {
        critStartedAtRef.current = performance.now();
      }
    });
    return unsub;
  }, []);

  // (Re-)cache the list of emissive-capable materials whenever appearance
  // changes — Boss is keyed on appearance so this fires after each remount.
  useEffect(() => {
    const root = bodyGroupRef.current;
    if (!root) return;
    const list: typeof cachedMaterialsRef.current = [];
    root.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = (obj as THREE.Mesh).material as THREE.Material | THREE.Material[];
        const mats = Array.isArray(m) ? m : [m];
        for (const mat of mats) {
          if (mat && (mat as THREE.MeshStandardMaterial).emissive) {
            const sm = mat as THREE.MeshStandardMaterial;
            list.push({
              mat: sm,
              origR: sm.emissive.r,
              origG: sm.emissive.g,
              origB: sm.emissive.b,
            });
          }
        }
      }
    });
    cachedMaterialsRef.current = list;
    return () => {
      // On unmount, leave materials at their original tint.
      for (const item of list) {
        item.mat.emissive.setRGB(item.origR, item.origG, item.origB);
      }
      lastEmissiveRef.current = 0;
    };
  }, [appearance]);

  // ── Grab: Torso and Head can be grabbed ──
  const onGrab = useCallback(
    (e: ThreeEvent<PointerEvent>, bodyRef: React.RefObject<RapierRigidBody | null>) => {
      e.stopPropagation();
      if (!bodyRef.current) return;
      if (!dragState.isPointerDown) return;

      const pos = safeBodyVec3(bodyRef.current, 'translation');
      if (!pos) return;

      dragState.body = bodyRef.current;

      const camDir = camera.getWorldDirection(new THREE.Vector3());
      dragState.plane.setFromNormalAndCoplanarPoint(camDir.clone().negate(), e.point);
      dragState.offset.set(pos.x - e.point.x, pos.y - e.point.y, pos.z - e.point.z);

      setIsDragging(true);
    },
    [camera, setIsDragging],
  );

  // Reset the module-level drag context when this Boss instance unmounts so the
  // next Boss (mounted under a new key) never inherits a stale rapier handle.
  useEffect(() => {
    return () => {
      dragState.body = null;
      dragState.isPointerDown = false;
    };
  }, []);

  // ── Pointer state tracking ──
  useEffect(() => {
    const handleDown = () => { dragState.isPointerDown = true; };
    const handleUp = () => {
      dragState.isPointerDown = false;
      if (dragState.body) {
        dragState.body = null;
        setIsDragging(false);
      }
    };
    window.addEventListener('pointerdown', handleDown, true);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointerdown', handleDown, true);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [setIsDragging]);

  // ── Frame loop ──
  useFrame((state, delta) => {
    decayRecentDamage(delta * 500);

    // Crit flash: tint every cached material toward red, then fade back. The
    // curve has a fast attack (~50ms) and a longer decay (~250ms) so it reads
    // as a punchy hit rather than a strobe.
    {
      const now = performance.now();
      const start = critStartedAtRef.current;
      const elapsed = start ? now - start : Infinity;
      let factor = 0;
      if (elapsed < 50) factor = elapsed / 50;
      else if (elapsed < 150) factor = 1;
      else if (elapsed < 320) factor = 1 - (elapsed - 150) / 170;
      else factor = 0;

      if (factor !== lastEmissiveRef.current) {
        const mats = cachedMaterialsRef.current;
        if (factor <= 0.001) {
          // Restore each material to its captured original emissive.
          for (let i = 0; i < mats.length; i++) {
            const it = mats[i];
            it.mat.emissive.setRGB(it.origR, it.origG, it.origB);
          }
        } else {
          // Strong red emissive that visually overwhelms the base color.
          const r = it_lerp(0, 1.6, factor);
          const g = it_lerp(0, 0.05, factor);
          const b = it_lerp(0, 0.05, factor);
          for (let i = 0; i < mats.length; i++) {
            const it = mats[i];
            it.mat.emissive.setRGB(
              Math.max(it.origR, r),
              Math.max(it.origG, g),
              Math.max(it.origB, b),
            );
          }
        }
        lastEmissiveRef.current = factor;
      }
    }

    if (!dragState.isPointerDown && dragState.body) {
      dragState.body = null;
      setIsDragging(false);
    }

    const body = dragState.body;
    if (!body) return;

    if (!state.camera || !state.pointer || !state.raycaster) return;
    
    state.raycaster.setFromCamera(state.pointer, state.camera);
    const target = new THREE.Vector3();
    const hit = state.raycaster.ray.intersectPlane(dragState.plane, target);
    if (!hit) return;

    const dx = THREE.MathUtils.clamp(hit.x + dragState.offset.x, -7, 7);
    const dy = THREE.MathUtils.clamp(hit.y + dragState.offset.y, 0.5, 9);
    const dz = THREE.MathUtils.clamp(hit.z + dragState.offset.z, -5, 8);

    const pos = safeBodyVec3(body, 'translation');
    if (!pos) {
      // Stale wasm handle (boss remounted). Drop it cleanly.
      dragState.body = null;
      setIsDragging(false);
      return;
    }
    if (isNaN(pos.x)) return;

    // Drag is now a velocity P-controller rather than an impulse spring. We
    // compute the velocity needed to close the position error in roughly
    // 1/responsiveness seconds and assign it directly to the rigid body. This
    // bypasses mass + linearDamping interactions that previously made the
    // boss feel sluggish (combined effective mass with joints ≈ 21, plus
    // rapier's per-step damping was eating most of the impulse).
    //
    // A `maxSpeed` cap keeps fast cursor flicks from yanking joints into
    // explosion territory; the rest of the body still tracks the torso
    // through the spherical/revolute joints with its own physics.
    const responsiveness = 30;
    const maxSpeed = 60;

    let vx = (dx - pos.x) * responsiveness;
    let vy = (dy - pos.y) * responsiveness;
    let vz = (dz - pos.z) * responsiveness;
    const speed = Math.hypot(vx, vy, vz);
    if (speed > maxSpeed) {
      const k = maxSpeed / speed;
      vx *= k;
      vy *= k;
      vz *= k;
    }

    try {
      body.setLinvel({ x: vx, y: vy, z: vz }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      body.wakeUp();
    } catch {
      dragState.body = null;
      setIsDragging(false);
    }
  });

  const bs = bodyScale(appearance.bodyType);
  const hs = heightScale(appearance.height);

  return (
    <group ref={bodyGroupRef} scale={[1, hs, 1]}>
      {/* ── Torso ── */}
      <RigidBody
        ref={torsoRef}
        position={[0, 3.5, 0]}
        mass={8}
        linearDamping={2}
        angularDamping={4}
        enabledRotations={[false, false, false]}
        collisionGroups={interactionGroups([1], [0, 2])}
        userData={{ isBoss: true }}
      >
        <group onPointerDown={(e) => onGrab(e, torsoRef)}>
          <CuboidCollider args={[0.55, 0.6, 0.35]} />
          {/* Visual-only body type scaling. Collider stays fixed for stable
              physics while the rendered torso scales with `bodyType`. */}
          <group scale={[bs.torsoX, bs.torsoY, bs.torsoZ]}>
            <OutfitMesh appearance={appearance} damageLevel={damageLevel} />
          </group>
          {/* Damage marks on torso (rendered outside the scale group so they
              line up with where physics expects the chest to be). */}
          {damageLevel >= 2 && (
            <mesh position={[0.2, 0.1, 0.36]}>
              <planeGeometry args={[0.3, 0.2]} />
              <meshStandardMaterial color={appearance.skinColor} side={2} />
            </mesh>
          )}
          {damageLevel >= 3 && (
            <mesh position={[-0.15, -0.2, 0.36]}>
              <planeGeometry args={[0.4, 0.25]} />
              <meshStandardMaterial color={appearance.skinColor} side={2} />
            </mesh>
          )}
          {damageLevel >= 4 && (
            <mesh position={[0, 0.2, 0.36]}>
              <planeGeometry args={[0.5, 0.3]} />
              <meshStandardMaterial color={appearance.skinColor} side={2} />
            </mesh>
          )}
        </group>
      </RigidBody>

      {/* ── Head ── */}
      <HeadPart headRef={headRef} torsoRef={torsoRef} onGrab={(e) => onGrab(e, headRef)} />

      {/* ── Arms ── */}
      <ArmPart side="left" armRef={leftArmRef} torsoRef={torsoRef} />
      <ArmPart side="right" armRef={rightArmRef} torsoRef={torsoRef} />

      {/* ── Legs ── */}
      <LegPart side="left" legRef={leftLegRef} torsoRef={torsoRef} />
      <LegPart side="right" legRef={rightLegRef} torsoRef={torsoRef} />
    </group>
  );
}

// ─────────────────────────────────────────────
// Head
// ─────────────────────────────────────────────

// ── Dizzy spiral eye (cartoon @@ style) ──
function DizzyEye({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = state.clock.elapsedTime * 2.5;
    }
  });

  // Build a spiral from small segments
  const spiralSegments: Array<{ x: number; y: number; r: number }> = [];
  const turns = 2.5;
  const steps = 20;
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const angle = t * turns * Math.PI * 2;
    const radius = t * 0.08;
    spiralSegments.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      r: angle,
    });
  }

  return (
    <mesh position={position}>
      <sphereGeometry args={[0.12, 16, 16]} />
      <meshStandardMaterial color="white" />
      <group ref={groupRef} position={[0, 0, 0.11]}>
        {spiralSegments.map((seg, i) => {
          if (i === 0) return null;
          const prev = spiralSegments[i - 1];
          const mx = (seg.x + prev.x) / 2;
          const my = (seg.y + prev.y) / 2;
          const dx = seg.x - prev.x;
          const dy = seg.y - prev.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const rot = Math.atan2(dy, dx);
          return (
            <mesh key={i} position={[mx, my, 0]} rotation={[0, 0, rot]}>
              <boxGeometry args={[len + 0.005, 0.015, 0.005]} />
              <meshStandardMaterial color="#333333" />
            </mesh>
          );
        })}
      </group>
    </mesh>
  );
}

function HeadPart({
  headRef,
  torsoRef,
  onGrab,
}: {
  headRef: React.RefObject<RapierRigidBody | null>;
  torsoRef: React.RefObject<RapierRigidBody | null>;
  onGrab: (e: ThreeEvent<PointerEvent>) => void;
}) {
  const appearance = useGameStore((s) => s.appearance);
  const recentDamage = useGameStore((s) => s.recentDamage);
  const damageLevel = useGameStore((s) => s.damageLevel);

  let phase: 'normal' | 'angry' | 'hurt' | 'fainted' = 'normal';
  if (recentDamage >= 3000) phase = 'fainted';
  else if (recentDamage >= 1500) phase = 'hurt';
  else if (recentDamage >= 500) phase = 'angry';

  const leftEyebrowRot = phase === 'angry' ? -0.7 : phase === 'hurt' || phase === 'fainted' ? 0.4 : -0.35;
  const rightEyebrowRot = phase === 'angry' ? 0.7 : phase === 'hurt' || phase === 'fainted' ? -0.4 : 0.35;

  useSphericalJoint(torsoRef as React.RefObject<RapierRigidBody>, headRef as React.RefObject<RapierRigidBody>, [
    [0, 0.7, 0],
    [0, -0.7, 0],
  ]);

  // Keep head facing forward with spring torque
  useFrame(() => {
    const head = headRef.current;
    if (!head) return;
    const rot = safeBodyRotation(head);
    if (!rot) return; // wasm handle disposed (e.g. boss remount); skip this frame
    const euler = new THREE.Euler().setFromQuaternion(
      new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w)
    );
    const stiffness = 2;
    if (!isNaN(euler.x)) {
      try {
        head.applyTorqueImpulse({
          x: -euler.x * stiffness,
          y: -euler.y * stiffness,
          z: -euler.z * stiffness,
        }, true);
      } catch {
        // stale handle, ignore
      }
    }
  });

  const lastPainSound = useRef(0);
  const lastPainDamage = useRef(recentDamage);
  useEffect(() => {
    const damageIncreased = recentDamage > lastPainDamage.current + 20;
    lastPainDamage.current = recentDamage;
    if (!damageIncreased) return;

    const now = performance.now();
    if (now - lastPainSound.current > 1000) {
      if (phase !== 'normal') {
        playPainSound(phase, appearance.gender);
        lastPainSound.current = now;
      }
    }
  }, [phase, appearance.gender, recentDamage]);

  return (
    <RigidBody
      ref={headRef}
      position={[0, 4.9, 0]}
      mass={3}
      linearDamping={2}
      angularDamping={8}
      collisionGroups={interactionGroups([1], [0, 2])}
      userData={{ isBoss: true }}
    >
      <group onPointerDown={onGrab}>
        <BallCollider args={[0.7]} />
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.7, 24, 24]} />
          <meshStandardMaterial color={appearance.skinColor} roughness={0.5} />
        </mesh>

      {/* Name Tag */}
      {appearance.name && (
        <Html position={[0, 1.2, 0]} center transform>
          <div
            // data-canvas-overlay marks this DOM node for compositing into the
            // PNG screenshot (since drei <Html> is rendered as a sibling DOM
            // node, it isn't part of the WebGL drawing buffer).
            data-canvas-overlay="boss-name"
            style={{
              // Display fonts (Lilita One / Black Han Sans) only ship weight 400
              // — letting the browser fake a 900 produced a blurry "double" look.
              // Use the font's native weight and rely on font-size + a thin halo
              // for legibility instead.
              color: '#ff4500',
              fontSize: '16px',
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              textShadow:
                '0 1px 0 #fff, 0 -1px 0 #fff, 1px 0 0 #fff, -1px 0 0 #fff, 0 2px 4px rgba(0,0,0,0.5)',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-display)',
              pointerEvents: 'none',
            }}
          >
            {appearance.name}
          </div>
        </Html>
      )}

      <HatMesh appearance={appearance} />

      {/* Hair */}
      {appearance.hairStyle === 'short' && (
        <mesh position={[0, 0.25, 0]}>
          <sphereGeometry args={[0.72, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2.5]} />
          <meshStandardMaterial color={appearance.hairColor} roughness={0.9} />
        </mesh>
      )}
      {appearance.hairStyle === 'long' && (
        <group>
          <mesh position={[0, 0.25, 0]}>
            <sphereGeometry args={[0.72, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2.5]} />
            <meshStandardMaterial color={appearance.hairColor} roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.3, -0.5]}>
            <boxGeometry args={[1.4, 1.2, 0.3]} />
            <meshStandardMaterial color={appearance.hairColor} roughness={0.9} />
          </mesh>
          <mesh position={[-0.75, -0.2, -0.1]}>
            <boxGeometry args={[0.2, 1.0, 0.6]} />
            <meshStandardMaterial color={appearance.hairColor} roughness={0.9} />
          </mesh>
          <mesh position={[0.75, -0.2, -0.1]}>
            <boxGeometry args={[0.2, 1.0, 0.6]} />
            <meshStandardMaterial color={appearance.hairColor} roughness={0.9} />
          </mesh>
        </group>
      )}
      {appearance.hairStyle === 'spiky' && (
        <group>
          {/* Tighter scalp dome (top y ≈ 0.8) so spikes clearly poke above. */}
          <mesh position={[0, 0.1, 0]}>
            <sphereGeometry args={[0.7, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2.4]} />
            <meshStandardMaterial color={appearance.hairColor} roughness={0.9} />
          </mesh>
          {/* Center spike — tallest, tip at y ≈ 1.3 */}
          <mesh position={[0, 0.95, 0]}>
            <coneGeometry args={[0.18, 0.7, 4]} />
            <meshStandardMaterial color={appearance.hairColor} roughness={0.9} />
          </mesh>
          {/* Front-left / front-right side spikes */}
          <mesh position={[-0.3, 0.85, 0.25]} rotation={[0.15, 0, 0.5]}>
            <coneGeometry args={[0.14, 0.6, 4]} />
            <meshStandardMaterial color={appearance.hairColor} roughness={0.9} />
          </mesh>
          <mesh position={[0.3, 0.85, 0.25]} rotation={[0.15, 0, -0.5]}>
            <coneGeometry args={[0.14, 0.6, 4]} />
            <meshStandardMaterial color={appearance.hairColor} roughness={0.9} />
          </mesh>
          {/* Back spikes for silhouette */}
          <mesh position={[-0.28, 0.78, -0.25]} rotation={[-0.2, 0, 0.4]}>
            <coneGeometry args={[0.12, 0.5, 4]} />
            <meshStandardMaterial color={appearance.hairColor} roughness={0.9} />
          </mesh>
          <mesh position={[0.28, 0.78, -0.25]} rotation={[-0.2, 0, -0.4]}>
            <coneGeometry args={[0.12, 0.5, 4]} />
            <meshStandardMaterial color={appearance.hairColor} roughness={0.9} />
          </mesh>
        </group>
      )}
      {appearance.hairStyle === 'mohawk' && (
        <group>
          <mesh position={[0, 0.1, 0]}>
            <sphereGeometry args={[0.71, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2.5]} />
            <meshStandardMaterial color={appearance.skinColor} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.6, -0.1]} rotation={[Math.PI/8, 0, 0]}>
            <boxGeometry args={[0.15, 0.4, 0.8]} />
            <meshStandardMaterial color={appearance.hairColor} roughness={0.9} />
          </mesh>
        </group>
      )}

      {appearance.hairStyle === 'bob' && (
        <group>
          <mesh position={[0, 0.25, 0]}>
            <sphereGeometry args={[0.72, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
            <meshStandardMaterial color={appearance.hairColor} roughness={0.9} />
          </mesh>
          <mesh position={[-0.75, -0.1, 0.1]}>
            <boxGeometry args={[0.2, 0.7, 0.5]} />
            <meshStandardMaterial color={appearance.hairColor} roughness={0.9} />
          </mesh>
          <mesh position={[0.75, -0.1, 0.1]}>
            <boxGeometry args={[0.2, 0.7, 0.5]} />
            <meshStandardMaterial color={appearance.hairColor} roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.1, -0.45]}>
            <boxGeometry args={[1.5, 0.7, 0.4]} />
            <meshStandardMaterial color={appearance.hairColor} roughness={0.9} />
          </mesh>
        </group>
      )}
      {appearance.hairStyle === 'bun' && (
        <group>
          <mesh position={[0, 0.25, 0]}>
            <sphereGeometry args={[0.72, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
            <meshStandardMaterial color={appearance.hairColor} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.85, -0.2]}>
            <sphereGeometry args={[0.25, 16, 16]} />
            <meshStandardMaterial color={appearance.hairColor} roughness={0.9} />
          </mesh>
        </group>
      )}
      {appearance.hairStyle === 'pigtails' && (
        <group>
          <mesh position={[0, 0.25, 0]}>
            <sphereGeometry args={[0.72, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
            <meshStandardMaterial color={appearance.hairColor} roughness={0.9} />
          </mesh>
          {/* Hair ties */}
          <mesh position={[-0.7, 0.45, -0.1]} rotation={[0, 0, Math.PI / 2.5]}>
            <cylinderGeometry args={[0.08, 0.08, 0.1]} />
            <meshStandardMaterial color="#e63946" />
          </mesh>
          <mesh position={[0.7, 0.45, -0.1]} rotation={[0, 0, -Math.PI / 2.5]}>
            <cylinderGeometry args={[0.08, 0.08, 0.1]} />
            <meshStandardMaterial color="#e63946" />
          </mesh>
          {/* Tails */}
          <mesh position={[-0.9, 0.3, -0.1]} rotation={[0, 0, Math.PI / 2.5]}>
            <coneGeometry args={[0.2, 0.7, 8]} />
            <meshStandardMaterial color={appearance.hairColor} roughness={0.9} />
          </mesh>
          <mesh position={[0.9, 0.3, -0.1]} rotation={[0, 0, -Math.PI / 2.5]}>
            <coneGeometry args={[0.2, 0.7, 8]} />
            <meshStandardMaterial color={appearance.hairColor} roughness={0.9} />
          </mesh>
        </group>
      )}

      {/* Eyes */}
      {phase === 'fainted' ? (
        <>
          {/* X_X eyes */}
          <group position={[-0.22, 0.15, 0.65]}>
            <mesh rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.2, 0.04, 0.02]} /><meshStandardMaterial color="#111" /></mesh>
            <mesh rotation={[0, 0, -Math.PI / 4]}><boxGeometry args={[0.2, 0.04, 0.02]} /><meshStandardMaterial color="#111" /></mesh>
          </group>
          <group position={[0.22, 0.15, 0.65]}>
            <mesh rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.2, 0.04, 0.02]} /><meshStandardMaterial color="#111" /></mesh>
            <mesh rotation={[0, 0, -Math.PI / 4]}><boxGeometry args={[0.2, 0.04, 0.02]} /><meshStandardMaterial color="#111" /></mesh>
          </group>
        </>
      ) : phase === 'hurt' ? (
        <>
          {/* Dizzy spiral eyes */}
          <DizzyEye position={[-0.22, 0.15, 0.62]} />
          <DizzyEye position={[0.22, 0.15, 0.62]} />
        </>
      ) : (
        <>
          {/* Normal eyes */}
          <mesh position={[-0.22, 0.15, 0.62]}>
            <sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color="white" />
            <mesh position={[0, 0, 0.1]}><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial color={appearance.eyeColor} /></mesh>
          </mesh>
          <mesh position={[0.22, 0.15, 0.62]}>
            <sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color="white" />
            <mesh position={[0, 0, 0.1]}><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial color={appearance.eyeColor} /></mesh>
          </mesh>
        </>
      )}

      {/* Bruise marks on face */}
      {damageLevel >= 2 && (
        <mesh position={[0.35, 0.05, 0.62]}>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshStandardMaterial color="#8b5cf6" transparent opacity={0.4} />
        </mesh>
      )}
      {damageLevel >= 3 && (
        <mesh position={[-0.3, -0.15, 0.63]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshStandardMaterial color="#7c3aed" transparent opacity={0.5} />
        </mesh>
      )}

      {/* Blush for female */}
      {appearance.gender === 'female' && phase !== 'fainted' && (
        <>
          <mesh position={[-0.35, -0.05, 0.62]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#ff8888" transparent opacity={0.6} />
          </mesh>
          <mesh position={[0.35, -0.05, 0.62]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#ff8888" transparent opacity={0.6} />
          </mesh>
        </>
      )}

      {/* Glasses */}
      {appearance.glassesStyle !== 'none' && (
        <group position={[0, 0.15, 0.68]}>
          <mesh position={[-0.22, 0, 0]}><boxGeometry args={[0.25, 0.15, 0.02]} /><meshStandardMaterial color={appearance.glassesStyle === 'sunglasses' ? '#111' : '#333'} transparent opacity={appearance.glassesStyle === 'sunglasses' ? 0.9 : 0.3} /></mesh>
          <mesh position={[0.22, 0, 0]}><boxGeometry args={[0.25, 0.15, 0.02]} /><meshStandardMaterial color={appearance.glassesStyle === 'sunglasses' ? '#111' : '#333'} transparent opacity={appearance.glassesStyle === 'sunglasses' ? 0.9 : 0.3} /></mesh>
          <mesh position={[0, 0, 0]}><boxGeometry args={[0.1, 0.02, 0.02]} /><meshStandardMaterial color="#111" /></mesh>
          <mesh position={[-0.35, 0, -0.2]} rotation={[0, Math.PI/2, 0]}><boxGeometry args={[0.4, 0.02, 0.02]} /><meshStandardMaterial color="#111" /></mesh>
          <mesh position={[0.35, 0, -0.2]} rotation={[0, Math.PI/2, 0]}><boxGeometry args={[0.4, 0.02, 0.02]} /><meshStandardMaterial color="#111" /></mesh>
        </group>
      )}

      <EyebrowsMesh appearance={appearance} leftRot={leftEyebrowRot} rightRot={rightEyebrowRot} />
      <NoseMesh appearance={appearance} />
      <MouthMesh appearance={appearance} phase={phase} />
      <FaceAccessoryMesh appearance={appearance} />

      {/* Tears */}
      {(phase === 'hurt' || phase === 'fainted') && (
        <>
          <mesh position={[-0.22, -0.05, 0.67]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#64b5f6" roughness={0.2} transparent opacity={0.8} />
          </mesh>
          <mesh position={[0.22, -0.05, 0.67]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#64b5f6" roughness={0.2} transparent opacity={0.8} />
          </mesh>
        </>
      )}

      {/* Bruises */}
      {(phase === 'hurt' || phase === 'fainted') && (
        <>
          <mesh position={[0.3, 0.3, 0.55]} rotation={[0, 0, 0.4]}>
            <boxGeometry args={[0.25, 0.15, 0.05]} />
            <meshStandardMaterial color="#4a148c" transparent opacity={0.6} />
          </mesh>
          <mesh position={[-0.4, -0.1, 0.5]} rotation={[0, 0, -0.2]}>
            <boxGeometry args={[0.2, 0.25, 0.05]} />
            <meshStandardMaterial color="#4a148c" transparent opacity={0.5} />
          </mesh>
        </>
      )}

      <FacialHairMesh appearance={appearance} />
      </group>
    </RigidBody>
  );
}

// ─────────────────────────────────────────────
// Arms
// ─────────────────────────────────────────────

function ArmPart({
  side,
  armRef,
  torsoRef,
}: {
  side: 'left' | 'right';
  armRef: React.RefObject<RapierRigidBody | null>;
  torsoRef: React.RefObject<RapierRigidBody | null>;
}) {
  const appearance = useGameStore((s) => s.appearance);
  const x = side === 'left' ? -0.6 : 0.6;

  useSphericalJoint(torsoRef as React.RefObject<RapierRigidBody>, armRef as React.RefObject<RapierRigidBody>, [
    [side === 'left' ? -0.6 : 0.6, 0.4, 0],
    [0, 0.4, 0],
  ]);

  return (
    <RigidBody
      ref={armRef}
      position={[x, 3.5, 0]}
      mass={2}
      linearDamping={3}
      angularDamping={8}
      collisionGroups={interactionGroups([1], [0, 2])}
      userData={{ isBoss: true }}
    >
      <CuboidCollider args={[0.15, 0.4, 0.15]} />
      <group scale={[bodyScale(appearance.bodyType).armX, 1, 1]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.3, 0.8, 0.3]} />
          <meshStandardMaterial color={appearance.shirtColor} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.5, 0]}>
          <sphereGeometry args={[0.18, 12, 12]} />
          <meshStandardMaterial color={appearance.skinColor} roughness={0.5} />
        </mesh>
      </group>
    </RigidBody>
  );
}

// ─────────────────────────────────────────────
// Legs
// ─────────────────────────────────────────────

function LegPart({
  side,
  legRef,
  torsoRef,
}: {
  side: 'left' | 'right';
  legRef: React.RefObject<RapierRigidBody | null>;
  torsoRef: React.RefObject<RapierRigidBody | null>;
}) {
  const appearance = useGameStore((s) => s.appearance);
  const x = side === 'left' ? -0.25 : 0.25;

  const joint = useRevoluteJoint(torsoRef as React.RefObject<RapierRigidBody>, legRef as React.RefObject<RapierRigidBody>, [
    [side === 'left' ? -0.25 : 0.25, -0.65, 0],
    [0, 0.5, 0],
    [1, 0, 0],
  ]);

  useEffect(() => {
    if (joint.current) {
      // Prevent legs from bending completely backwards (flamingo legs) or spinning 360 degrees
      joint.current.setLimits(-Math.PI / 2.5, Math.PI / 2.5);
    }
  }, [joint]);

  return (
    <RigidBody
      ref={legRef}
      position={[x, 2.35, 0]}
      mass={3}
      linearDamping={3}
      angularDamping={8}
      collisionGroups={interactionGroups([1], [0, 2])}
      userData={{ isBoss: true }}
    >
      <CuboidCollider args={[0.2, 0.5, 0.2]} />
      <group scale={[bodyScale(appearance.bodyType).legX, 1, 1]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.4, 1.0, 0.4]} />
          <meshStandardMaterial color={appearance.pantsColor} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.6, 0.08]}>
          <boxGeometry args={[0.42, 0.25, 0.55]} />
          <meshStandardMaterial color={appearance.shoeColor} roughness={0.85} />
        </mesh>
      </group>
    </RigidBody>
  );
}
