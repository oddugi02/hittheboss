'use client';

import { useRef } from 'react';
import { RigidBody, RapierRigidBody, CuboidCollider, interactionGroups, CollisionPayload } from '@react-three/rapier';
import { useGameStore } from '../store/gameStore';
import * as THREE from 'three';

interface PropDef {
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
  shape: 'box' | 'cylinder';
}

const OFFICE_PROPS: PropDef[] = [
  { position: [-3, 0.5, -1], scale: [0.6, 1, 0.6], color: '#5d4037', shape: 'box' },     // file cabinet
  { position: [3.5, 0.3, -1], scale: [0.4, 0.6, 0.4], color: '#78909c', shape: 'box' },   // trash can
  { position: [-2, 1.2, -2], scale: [0.8, 0.05, 0.4], color: '#6d4c41', shape: 'box' },   // shelf
  { position: [2.5, 0.15, 1], scale: [0.3, 0.3, 0.3], color: '#ffd54f', shape: 'box' },   // box
];

const CLASSROOM_PROPS: PropDef[] = [
  { position: [-3, 0.5, 0], scale: [0.8, 1, 0.5], color: '#8d6e63', shape: 'box' },       // small desk
  { position: [3, 0.3, 1], scale: [0.3, 0.6, 0.3], color: '#ff7043', shape: 'cylinder' }, // cone
  { position: [-2, 0.15, 1.5], scale: [0.4, 0.3, 0.3], color: '#42a5f5', shape: 'box' },  // box
  { position: [2, 1.5, -2.5], scale: [1.5, 1, 0.05], color: '#2e7d32', shape: 'box' },    // chalkboard
];

const ROOM_PROPS: PropDef[] = [
  { position: [-3.5, 0.4, 0], scale: [0.5, 0.8, 0.4], color: '#a1887f', shape: 'box' },   // nightstand
  { position: [3, 0.3, 1], scale: [0.5, 0.6, 0.5], color: '#ef5350', shape: 'box' },      // pillow
  { position: [-2, 0.2, 1.5], scale: [0.25, 0.4, 0.25], color: '#ffcc80', shape: 'cylinder' }, // lamp
];

const OUTSIDE_PROPS: PropDef[] = [
  { position: [-3, 0.3, 0], scale: [0.3, 0.6, 0.3], color: '#ffb74d', shape: 'cylinder' }, // traffic cone
  { position: [3.5, 0.25, 1], scale: [0.5, 0.5, 0.5], color: '#78909c', shape: 'box' },    // crate
  { position: [-2, 0.15, 2], scale: [0.35, 0.3, 0.35], color: '#8bc34a', shape: 'cylinder' }, // bucket
];

const PROP_MAP: Record<string, PropDef[]> = {
  office: OFFICE_PROPS,
  classroom: CLASSROOM_PROPS,
  room: ROOM_PROPS,
  outside: OUTSIDE_PROPS,
};

function DestructibleProp({ def }: { def: PropDef }) {
  const ref = useRef<RapierRigidBody>(null);
  const broken = useRef(false);

  return (
    <RigidBody
      ref={ref}
      position={def.position}
      type="dynamic"
      mass={2}
      linearDamping={3}
      angularDamping={3}
      collisionGroups={interactionGroups([3], [0, 2])}
      onCollisionEnter={(e: CollisionPayload) => {
        if (broken.current) return;
        const other = e.other.rigidBodyObject?.userData as { isWeapon?: boolean } | undefined;
        if (other?.isWeapon) {
          broken.current = true;
          // Fling the prop when hit
          if (ref.current) {
            const impulse = new THREE.Vector3(
              (Math.random() - 0.5) * 8,
              Math.random() * 6 + 2,
              (Math.random() - 0.5) * 8
            );
            ref.current.applyImpulse({ x: impulse.x, y: impulse.y, z: impulse.z }, true);
            ref.current.applyTorqueImpulse({
              x: (Math.random() - 0.5) * 4,
              y: (Math.random() - 0.5) * 4,
              z: (Math.random() - 0.5) * 4,
            }, true);
          }
        }
      }}
    >
      {def.shape === 'box' ? (
        <>
          <CuboidCollider args={[def.scale[0]/2, def.scale[1]/2, def.scale[2]/2]} />
          <mesh castShadow receiveShadow>
            <boxGeometry args={def.scale} />
            <meshStandardMaterial color={def.color} roughness={0.8} />
          </mesh>
        </>
      ) : (
        <>
          <CuboidCollider args={[def.scale[0]/2, def.scale[1]/2, def.scale[2]/2]} />
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[def.scale[0], def.scale[0] * 0.8, def.scale[1], 12]} />
            <meshStandardMaterial color={def.color} roughness={0.8} />
          </mesh>
        </>
      )}
    </RigidBody>
  );
}

export default function DestructibleProps() {
  const background = useGameStore((s) => s.background);
  const props = PROP_MAP[background] || [];

  return (
    <>
      {props.map((def, i) => (
        <DestructibleProp key={`${background}-${i}`} def={def} />
      ))}
    </>
  );
}
