'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useGameStore } from '../store/gameStore';
import * as THREE from 'three';

const PARTICLE_COUNT = 12;

function HitParticles({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummyRef = useRef(new THREE.Object3D());

  const particlesRef = useRef<Array<{
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    life: number;
    color: THREE.Color;
  }>>([]);

  useEffect(() => {
    if (particlesRef.current.length === 0) {
      const arr = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        arr.push({
          pos: new THREE.Vector3(...position),
          vel: new THREE.Vector3(
            (Math.random() - 0.5) * 12,
            Math.random() * 8 + 2,
            (Math.random() - 0.5) * 12
          ),
          life: 1,
          color: new THREE.Color().setHSL(Math.random() * 0.15 + 0.08, 1, 0.6),
        });
      }
      particlesRef.current = arr;
    }
  }, [position]);

  useFrame((_, delta) => {
    if (!meshRef.current || particlesRef.current.length === 0) return;
    const particles = particlesRef.current;
    const dummy = dummyRef.current;
    
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.life <= 0) continue;

      p.vel.y -= 18 * delta;
      p.pos.addScaledVector(p.vel, delta);
      p.life -= delta * 2.5;
      
      const s = Math.max(0, p.life) * 0.3;
      dummy.position.copy(p.pos);
      dummy.scale.setScalar(s);
      dummy.rotation.x += delta * 8;
      dummy.rotation.y += delta * 6;
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#ffcc00" emissive="#ff8800" emissiveIntensity={0.6} roughness={0.9} />
    </instancedMesh>
  );
}

// ── Floating 3D Hit Text ──
function HitTextEffect({ text, position, color }: { text: string; position: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Group>(null);
  const elapsedRef = useRef(0);

  useFrame((_, delta) => {
    if (!ref.current) return;
    elapsedRef.current += delta;
    const elapsed = elapsedRef.current;
    ref.current.position.y = position[1] + elapsed * 2;
    const scale = Math.max(0, 1 - elapsed * 0.7);
    ref.current.scale.setScalar(scale * (1 + Math.sin(elapsed * 8) * 0.1));
    (ref.current as THREE.Group & { visible: boolean }).visible = elapsed < 1.5;
  });

  return (
    <group ref={ref} position={position}>
      <Text
        fontSize={0.8}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.06}
        outlineColor="#000000"
        fontWeight="bold"
      >
        {text}
      </Text>
    </group>
  );
}

// ── Frozen overlay on boss ──
function FrozenOverlay() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.5;
  });
  return (
    <mesh ref={ref} position={[0, 3.5, 0]}>
      <octahedronGeometry args={[1.5, 0]} />
      <meshStandardMaterial color="#81d4fa" transparent opacity={0.25} wireframe />
    </mesh>
  );
}

// ── Stun stars circling boss head ──
function StunStars() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 3;
  });
  return (
    <group ref={groupRef} position={[0, 5.5, 0]}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[Math.cos(i * Math.PI / 2) * 0.8, 0, Math.sin(i * Math.PI / 2) * 0.8]}>
          <octahedronGeometry args={[0.12, 0]} />
          <meshStandardMaterial color="#ffd700" emissive="#ffa000" emissiveIntensity={1} />
        </mesh>
      ))}
    </group>
  );
}

// ── Boss guard shield ──
function GuardShield() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 1.2;
  });
  return (
    <mesh ref={ref} position={[0, 3.5, 0]}>
      <sphereGeometry args={[1.3, 32, 32]} />
      <meshStandardMaterial color="#90caf9" emissive="#1976d2" emissiveIntensity={0.5} transparent opacity={0.25} />
    </mesh>
  );
}

// ── Rage aura around boss ──
function RageAura() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) ref.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 6) * 0.05);
  });
  return (
    <mesh ref={ref} position={[0, 3.5, 0]}>
      <sphereGeometry args={[1.45, 24, 24]} />
      <meshStandardMaterial color="#ef5350" emissive="#b71c1c" emissiveIntensity={0.6} transparent opacity={0.18} />
    </mesh>
  );
}

export default function VFX() {
  const particles = useGameStore((s) => s.particles);
  const cleanupParticles = useGameStore((s) => s.cleanupParticles);
  const hitTexts = useGameStore((s) => s.hitTexts);
  const cleanupHitTexts = useGameStore((s) => s.cleanupHitTexts);
  const cleanupSpeechBubbles = useGameStore((s) => s.cleanupSpeechBubbles);
  const tickCombo = useGameStore((s) => s.tickCombo);
  const tickFrozen = useGameStore((s) => s.tickFrozen);
  const tickStunned = useGameStore((s) => s.tickStunned);
  const tickBossPatterns = useGameStore((s) => s.tickBossPatterns);
  const isFrozen = useGameStore((s) => s.isFrozen);
  const isStunned = useGameStore((s) => s.isStunned);
  const bossGuardActive = useGameStore((s) => s.bossGuardActive);
  const bossRageActive = useGameStore((s) => s.bossRageActive);

  useFrame((_, delta) => {
    cleanupParticles();
    cleanupHitTexts();
    cleanupSpeechBubbles();
    tickCombo(delta);
    tickFrozen(delta);
    tickStunned(delta);
    tickBossPatterns(delta);
  });

  return (
    <>
      {particles.map((p) => (
        <HitParticles key={p.id} position={p.position} />
      ))}
      {hitTexts.map((h) => (
        <HitTextEffect key={h.id} text={h.text} position={h.position} color={h.color} />
      ))}
      {isFrozen && <FrozenOverlay />}
      {isStunned && <StunStars />}
      {bossGuardActive && <GuardShield />}
      {bossRageActive && <RageAura />}
    </>
  );
}
