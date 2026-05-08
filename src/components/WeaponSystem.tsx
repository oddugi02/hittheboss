'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { RigidBody, BallCollider, RapierRigidBody, CylinderCollider, CuboidCollider, CollisionPayload } from '@react-three/rapier';
import { useGameStore } from '../store/gameStore';
import { playThrowSound, playHitSound } from '../utils/sounds';
import { HIT_WORDS, HIT_COLORS, SPEECH_NORMAL, SPEECH_ANGRY, SPEECH_HURT } from '../store/gameStore';

type WeaponType = 'macaron' | 'pencil' | 'book' | 'plate' | 'rock' | 'teapot' | 'chair' | 'desk' | 'arrow' | 'sword' | 'hammer' | 'bomb' | 'freeze' | 'banana';

interface WeaponProps {
  position: [number, number, number];
  impulse: [number, number, number];
}

interface Projectile {
  id: number;
  type: WeaponType;
  position: [number, number, number];
  impulse: [number, number, number];
}

let projectileId = 0;

// ── Special weapon wrapper with freeze/stun on hit ──
function SpecialWeaponWrapper({ 
  position, impulse, mass, damageMult, children, colliders, onBossHit, weaponType
}: { 
  position: [number, number, number], impulse: [number, number, number], mass: number, damageMult: number, children: React.ReactNode, colliders?: "hull" | "cuboid" | false, onBossHit?: () => void, weaponType: WeaponType
}) {
  const ref = useRef<RapierRigidBody>(null);
  const [angularVel] = useState<[number, number, number]>(() => [
    (Math.random() - 0.5) * 10,
    (Math.random() - 0.5) * 10,
    (Math.random() - 0.5) * 10
  ]);

  useEffect(() => {
    playThrowSound(weaponType);
  }, [weaponType]);

  const hasHitBoss = useRef(false);
  const addDamage = useGameStore((s) => s.addDamage);
  const addParticle = useGameStore((s) => s.addParticle);
  const addHitText = useGameStore((s) => s.addHitText);
  const addSpeechBubble = useGameStore((s) => s.addSpeechBubble);

  return (
    <RigidBody
      ccd={true}
      ref={ref}
      position={position}
      mass={mass}
      linearDamping={1.5}
      angularDamping={2}
      restitution={0.1}
      friction={0.8}
      colliders={colliders}
      linearVelocity={impulse}
      angularVelocity={angularVel}
      userData={{ isWeapon: true }}
      onCollisionEnter={(e: CollisionPayload) => {
        if (hasHitBoss.current) return;
        const other = e.other.rigidBodyObject?.userData as { isBoss?: boolean } | undefined;
        if (other?.isBoss) {
          hasHitBoss.current = true;
          const vel = ref.current?.linvel();
          if (vel) {
            const speed = Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2);
            if (speed > 3) {
              const damage = speed * damageMult;
              addDamage(damage, weaponType);
              playHitSound(speed / 10);
              const pos = ref.current?.translation();
              if (pos) {
                addParticle([pos.x, pos.y, pos.z]);
                const word = HIT_WORDS[Math.floor(Math.random() * HIT_WORDS.length)];
                const color = HIT_COLORS[Math.floor(Math.random() * HIT_COLORS.length)];
                addHitText(word, [pos.x + (Math.random() - 0.5), pos.y + 0.5, pos.z], color);
                if (Math.random() < 0.3) {
                  const { stress, maxStress } = useGameStore.getState();
                  const pct = stress / maxStress;
                  const list = pct > 0.5 ? SPEECH_NORMAL : pct > 0.2 ? SPEECH_ANGRY : SPEECH_HURT;
                  addSpeechBubble(list[Math.floor(Math.random() * list.length)]);
                }
              }
              onBossHit?.();
            }
          }
        }
      }}
    >
      {children}
    </RigidBody>
  );
}

// ── Bomb: area damage + explosion visual ──
const Bomb = ({ position, impulse }: WeaponProps) => {
  const addHitText = useGameStore((s) => s.addHitText);
  return (
    <SpecialWeaponWrapper position={position} impulse={impulse} mass={4} damageMult={12} weaponType="bomb"
      onBossHit={() => { addHitText('💥 EXPLOSION!', [0, 5, 0], '#ff4400'); }}>
      <group>
        <mesh castShadow><sphereGeometry args={[0.3, 16, 16]} /><meshStandardMaterial color="#333" /></mesh>
        <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.03, 0.03, 0.15]} /><meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={2} /></mesh>
      </group>
    </SpecialWeaponWrapper>
  );
};

// ── Freeze: freezes boss for 3 seconds (2x damage while frozen) ──
const Freeze = ({ position, impulse }: WeaponProps) => {
  const freezeBoss = useGameStore((s) => s.freezeBoss);
  const addHitText = useGameStore((s) => s.addHitText);
  return (
    <SpecialWeaponWrapper position={position} impulse={impulse} mass={2} damageMult={3} weaponType="freeze"
      onBossHit={() => { freezeBoss(); addHitText('❄️ FROZEN!', [0, 5.5, 0], '#00bcd4'); }}>
      <group>
        <mesh castShadow><sphereGeometry args={[0.25, 16, 16]} /><meshStandardMaterial color="#81d4fa" emissive="#00bcd4" emissiveIntensity={0.5} transparent opacity={0.8} /></mesh>
        <mesh castShadow><octahedronGeometry args={[0.35, 0]} /><meshStandardMaterial color="#e0f7fa" transparent opacity={0.3} wireframe /></mesh>
      </group>
    </SpecialWeaponWrapper>
  );
};

// ── Banana: stuns boss for 2 seconds ──
const Banana = ({ position, impulse }: WeaponProps) => {
  const stunBoss = useGameStore((s) => s.stunBoss);
  const addHitText = useGameStore((s) => s.addHitText);
  return (
    <SpecialWeaponWrapper position={position} impulse={impulse} mass={1} damageMult={2} weaponType="banana"
      onBossHit={() => { stunBoss(); addHitText('🍌 STUNNED!', [0, 5.5, 0], '#ffd700'); }}>
      <group rotation={[0, 0, Math.PI / 6]}>
        <mesh castShadow><capsuleGeometry args={[0.08, 0.5, 8, 16]} /><meshStandardMaterial color="#ffe135" /></mesh>
        <mesh castShadow position={[0, 0.32, 0]}><sphereGeometry args={[0.04, 8, 8]} /><meshStandardMaterial color="#8d6e63" /></mesh>
      </group>
    </SpecialWeaponWrapper>
  );
};


// === Weapon System ===

export default function WeaponSystem() {
  const { camera, raycaster, pointer } = useThree();
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);

  const shoot = useCallback(() => {
    raycaster.setFromCamera(pointer, camera);
    const dir = raycaster.ray.direction.clone().normalize();
    const spawn = camera.position.clone().add(dir.clone().multiplyScalar(1.5));
    const speed = 70; // Increased speed significantly

    const { selectedWeapon, unlockedWeapons } = useGameStore.getState();
    const pool = (unlockedWeapons.length > 0 ? unlockedWeapons : ['macaron']) as WeaponType[];
    if (selectedWeapon !== 'random' && !unlockedWeapons.includes(selectedWeapon as WeaponType)) {
      return;
    }
    const type = selectedWeapon === 'random'
      ? pool[Math.floor(Math.random() * pool.length)]
      : (selectedWeapon as WeaponType);

    const proj: Projectile = {
      id: projectileId++,
      type,
      position: [spawn.x, spawn.y, spawn.z],
      impulse: [dir.x * speed, dir.y * speed, dir.z * speed],
    };

    setProjectiles((prev) => {
      const next = [...prev, proj];
      return next.length > 30 ? next.slice(-30) : next;
    });
  }, [camera, raycaster, pointer]);

  useEffect(() => {
    const handler = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'CANVAS') {
        shoot();
      }
    };
    window.addEventListener('pointerdown', handler);
    return () => window.removeEventListener('pointerdown', handler);
  }, [shoot]);

  return (
    <>
      {projectiles.map((p) => {
        switch (p.type) {
          case 'macaron': return <Macaron key={p.id} position={p.position} impulse={p.impulse} />;
          case 'pencil': return <Pencil key={p.id} position={p.position} impulse={p.impulse} />;
          case 'book': return <Book key={p.id} position={p.position} impulse={p.impulse} />;
          case 'plate': return <Plate key={p.id} position={p.position} impulse={p.impulse} />;
          case 'rock': return <Rock key={p.id} position={p.position} impulse={p.impulse} />;
          case 'teapot': return <Teapot key={p.id} position={p.position} impulse={p.impulse} />;
          case 'chair': return <Chair key={p.id} position={p.position} impulse={p.impulse} />;
          case 'desk': return <Desk key={p.id} position={p.position} impulse={p.impulse} />;
          case 'arrow': return <Arrow key={p.id} position={p.position} impulse={p.impulse} />;
          case 'sword': return <Sword key={p.id} position={p.position} impulse={p.impulse} />;
          case 'hammer': return <Hammer key={p.id} position={p.position} impulse={p.impulse} />;
          case 'bomb': return <Bomb key={p.id} position={p.position} impulse={p.impulse} />;
          case 'freeze': return <Freeze key={p.id} position={p.position} impulse={p.impulse} />;
          case 'banana': return <Banana key={p.id} position={p.position} impulse={p.impulse} />;
          default: return null;
        }
      })}
    </>
  );
}


// Common weapon logic wrapper
function WeaponWrapper({ 
  position, impulse, mass, damageMult, children, colliders, weaponType
}: { 
  position: [number, number, number], impulse: [number, number, number], mass: number, damageMult: number, children: React.ReactNode, colliders?: "hull" | "cuboid" | false, weaponType: WeaponType
}) {
  const ref = useRef<RapierRigidBody>(null);
  const [angularVel] = useState<[number, number, number]>(() => [
    (Math.random() - 0.5) * 10,
    (Math.random() - 0.5) * 10,
    (Math.random() - 0.5) * 10
  ]);

  useEffect(() => {
    playThrowSound(weaponType);
  }, [weaponType]);

  const hasHitBoss = useRef(false);
  const addDamage = useGameStore((s) => s.addDamage);
  const addParticle = useGameStore((s) => s.addParticle);
  const addHitText = useGameStore((s) => s.addHitText);
  const addSpeechBubble = useGameStore((s) => s.addSpeechBubble);

  return (
    <RigidBody
      ccd={true}
      ref={ref}
      position={position}
      mass={mass}
      linearDamping={1.5}
      angularDamping={2}
      restitution={0.1}
      friction={0.8}
      colliders={colliders}
      linearVelocity={impulse}
      angularVelocity={angularVel}
      userData={{ isWeapon: true }}
      onCollisionEnter={(e: CollisionPayload) => {
        if (hasHitBoss.current) return;
        const other = e.other.rigidBodyObject?.userData as { isBoss?: boolean } | undefined;
        if (other?.isBoss) {
          hasHitBoss.current = true;
          const vel = ref.current?.linvel();
          if (vel) {
            const speed = Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2);
            if (speed > 3) {
              const damage = speed * damageMult;
              addDamage(damage, weaponType);
              playHitSound(speed / 10);
              const pos = ref.current?.translation();
              if (pos) {
                addParticle([pos.x, pos.y, pos.z]);
                const word = HIT_WORDS[Math.floor(Math.random() * HIT_WORDS.length)];
                const color = HIT_COLORS[Math.floor(Math.random() * HIT_COLORS.length)];
                addHitText(word, [pos.x + (Math.random() - 0.5), pos.y + 0.5, pos.z], color);
                if (Math.random() < 0.3) {
                  const { stress, maxStress } = useGameStore.getState();
                  const pct = stress / maxStress;
                  const list = pct > 0.5 ? SPEECH_NORMAL : pct > 0.2 ? SPEECH_ANGRY : SPEECH_HURT;
                  addSpeechBubble(list[Math.floor(Math.random() * list.length)]);
                }
              }
            }
          }
        }
      }}
    >
      {children}
    </RigidBody>
  );
}

// === Weapon Components ===

const Macaron = ({ position, impulse }: WeaponProps) => (
  <WeaponWrapper position={position} impulse={impulse} mass={1.5} damageMult={2} colliders={false} weaponType="macaron">
    <BallCollider args={[0.25]} />
    <mesh castShadow>
      <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
      <meshStandardMaterial color="#ff99c8" roughness={0.7} />
    </mesh>
    <mesh scale={[1.02, 0.4, 1.02]}>
      <cylinderGeometry args={[0.28, 0.28, 0.2, 16]} />
      <meshStandardMaterial color="#fff8f0" roughness={0.8} />
    </mesh>
  </WeaponWrapper>
);

const Pencil = ({ position, impulse }: WeaponProps) => (
  <WeaponWrapper position={position} impulse={impulse} mass={1} damageMult={2.5} colliders={false} weaponType="pencil">
    <CuboidCollider args={[0.05, 0.05, 0.4]} />
    <mesh castShadow>
      <boxGeometry args={[0.1, 0.1, 0.8]} />
      <meshStandardMaterial color="#ffbc42" roughness={0.6} />
    </mesh>
    <mesh position={[0, 0, 0.4]}>
      <boxGeometry args={[0.1, 0.1, 0.15]} />
      <meshStandardMaterial color="#f08080" roughness={0.8} />
    </mesh>
    <mesh position={[0, 0, -0.4]}>
      <boxGeometry args={[0.08, 0.08, 0.12]} />
      <meshStandardMaterial color="#deb887" roughness={0.8} />
    </mesh>
    <mesh position={[0, 0, -0.48]}>
      <boxGeometry args={[0.03, 0.03, 0.06]} />
      <meshStandardMaterial color="#333" roughness={0.8} />
    </mesh>
  </WeaponWrapper>
);

const Book = ({ position, impulse }: WeaponProps) => (
  <WeaponWrapper position={position} impulse={impulse} mass={2} damageMult={2} colliders="cuboid" weaponType="book">
    <mesh castShadow>
      <boxGeometry args={[0.6, 0.8, 0.15]} />
      <meshStandardMaterial color="#2196f3" roughness={0.5} />
    </mesh>
    {/* Pages */}
    <mesh position={[0.02, 0, 0]}>
      <boxGeometry args={[0.58, 0.76, 0.13]} />
      <meshStandardMaterial color="#fff" />
    </mesh>
  </WeaponWrapper>
);

const Plate = ({ position, impulse }: WeaponProps) => (
  <WeaponWrapper position={position} impulse={impulse} mass={1.5} damageMult={1.5} colliders={false} weaponType="plate">
    <CylinderCollider args={[0.02, 0.4]} />
    <mesh castShadow>
      <cylinderGeometry args={[0.4, 0.3, 0.04, 24]} />
      <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} />
    </mesh>
  </WeaponWrapper>
);

const Rock = ({ position, impulse }: WeaponProps) => (
  <WeaponWrapper position={position} impulse={impulse} mass={3} damageMult={4} colliders="hull" weaponType="rock">
    <mesh castShadow>
      <dodecahedronGeometry args={[0.3, 0]} />
      <meshStandardMaterial color="#7f8c8d" roughness={0.9} />
    </mesh>
  </WeaponWrapper>
);

const Teapot = ({ position, impulse }: WeaponProps) => (
  <WeaponWrapper position={position} impulse={impulse} mass={2} damageMult={2.5} colliders="hull" weaponType="teapot">
    <group>
      {/* Body */}
      <mesh castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#e74c3c" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Spout */}
      <mesh position={[0.3, 0.1, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <cylinderGeometry args={[0.05, 0.08, 0.25]} />
        <meshStandardMaterial color="#e74c3c" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Handle */}
      <mesh position={[-0.3, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.15, 0.05, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#e74c3c" roughness={0.3} metalness={0.2} />
      </mesh>
    </group>
  </WeaponWrapper>
);

const Chair = ({ position, impulse }: WeaponProps) => (
  <WeaponWrapper position={position} impulse={impulse} mass={5} damageMult={6} colliders="hull" weaponType="chair">
    <group scale={0.5}>
      {/* Seat */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[1, 0.1, 1]} />
        <meshStandardMaterial color="#8d6e63" />
      </mesh>
      {/* Legs */}
      <mesh castShadow position={[-0.4, -0.5, -0.4]}><boxGeometry args={[0.1, 1, 0.1]} /><meshStandardMaterial color="#5d4037" /></mesh>
      <mesh castShadow position={[0.4, -0.5, -0.4]}><boxGeometry args={[0.1, 1, 0.1]} /><meshStandardMaterial color="#5d4037" /></mesh>
      <mesh castShadow position={[-0.4, -0.5, 0.4]}><boxGeometry args={[0.1, 1, 0.1]} /><meshStandardMaterial color="#5d4037" /></mesh>
      <mesh castShadow position={[0.4, -0.5, 0.4]}><boxGeometry args={[0.1, 1, 0.1]} /><meshStandardMaterial color="#5d4037" /></mesh>
      {/* Backrest */}
      <mesh castShadow position={[0, 0.5, -0.45]}>
        <boxGeometry args={[1, 1, 0.1]} />
        <meshStandardMaterial color="#8d6e63" />
      </mesh>
    </group>
  </WeaponWrapper>
);

const Desk = ({ position, impulse }: WeaponProps) => (
  <WeaponWrapper position={position} impulse={impulse} mass={12} damageMult={15} colliders="hull" weaponType="desk">
    <group scale={0.6}>
      {/* Top */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[2.4, 0.15, 1.2]} />
        <meshStandardMaterial color="#6d4c41" />
      </mesh>
      {/* Legs */}
      <mesh castShadow position={[-1.1, -0.75, -0.5]}><boxGeometry args={[0.15, 1.5, 0.15]} /><meshStandardMaterial color="#3e2723" /></mesh>
      <mesh castShadow position={[1.1, -0.75, -0.5]}><boxGeometry args={[0.15, 1.5, 0.15]} /><meshStandardMaterial color="#3e2723" /></mesh>
      <mesh castShadow position={[-1.1, -0.75, 0.5]}><boxGeometry args={[0.15, 1.5, 0.15]} /><meshStandardMaterial color="#3e2723" /></mesh>
      <mesh castShadow position={[1.1, -0.75, 0.5]}><boxGeometry args={[0.15, 1.5, 0.15]} /><meshStandardMaterial color="#3e2723" /></mesh>
    </group>
  </WeaponWrapper>
);

const Arrow = ({ position, impulse }: WeaponProps) => (
  <WeaponWrapper position={position} impulse={impulse} mass={0.5} damageMult={4} colliders="hull" weaponType="arrow">
    <group rotation={[Math.PI / 2, 0, 0]}>
      {/* Shaft */}
      <mesh castShadow>
        <cylinderGeometry args={[0.02, 0.02, 1]} />
        <meshStandardMaterial color="#a1887f" />
      </mesh>
      {/* Tip */}
      <mesh castShadow position={[0, 0.55, 0]}>
        <coneGeometry args={[0.06, 0.15, 4]} />
        <meshStandardMaterial color="#9e9e9e" metalness={0.8} />
      </mesh>
      {/* Feathers */}
      <mesh position={[0, -0.45, 0]}>
        <boxGeometry args={[0.15, 0.2, 0.01]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
    </group>
  </WeaponWrapper>
);

const Sword = ({ position, impulse }: WeaponProps) => (
  <WeaponWrapper position={position} impulse={impulse} mass={3} damageMult={8} colliders="hull" weaponType="sword">
    <group rotation={[Math.PI / 2, 0, 0]}>
      {/* Blade */}
      <mesh castShadow position={[0, 0.4, 0]}>
        <boxGeometry args={[0.1, 1.2, 0.02]} />
        <meshStandardMaterial color="#e0e0e0" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Guard */}
      <mesh castShadow position={[0, -0.2, 0]}>
        <boxGeometry args={[0.3, 0.05, 0.05]} />
        <meshStandardMaterial color="#ffb300" metalness={0.6} />
      </mesh>
      {/* Handle */}
      <mesh castShadow position={[0, -0.35, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.25]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
    </group>
  </WeaponWrapper>
);

const Hammer = ({ position, impulse }: WeaponProps) => (
  <WeaponWrapper position={position} impulse={impulse} mass={6} damageMult={10} colliders="hull" weaponType="hammer">
    <group rotation={[Math.PI / 2, 0, 0]}>
      {/* Handle */}
      <mesh castShadow position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.8]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      {/* Head */}
      <mesh castShadow position={[0, 0.3, 0]}>
        <boxGeometry args={[0.4, 0.2, 0.2]} />
        <meshStandardMaterial color="#9e9e9e" metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  </WeaponWrapper>
);




