'use client';

import { Canvas } from '@react-three/fiber';
import { useGameStore } from '../store/gameStore';
import type { WeaponType } from '../store/gameStore';
import { WEAPON_BY_KEY, isWeaponUnlockReady } from '../utils/progression';
import type { WeaponKey } from '../types/progression';

// ── Tiny 3D weapon meshes for preview ──

function MacaronPreview() {
  return (
    <group rotation={[0.3, 0.5, 0]}>
      <mesh><cylinderGeometry args={[0.3, 0.3, 0.2, 16]} /><meshStandardMaterial color="#ff99c8" /></mesh>
      <mesh scale={[1.02, 0.4, 1.02]}><cylinderGeometry args={[0.28, 0.28, 0.2, 16]} /><meshStandardMaterial color="#fff8f0" /></mesh>
    </group>
  );
}

function PencilPreview() {
  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <mesh><boxGeometry args={[0.1, 0.8, 0.1]} /><meshStandardMaterial color="#ffbc42" /></mesh>
      <mesh position={[0, 0.4, 0]}><boxGeometry args={[0.1, 0.15, 0.1]} /><meshStandardMaterial color="#f08080" /></mesh>
      <mesh position={[0, -0.45, 0]}><boxGeometry args={[0.06, 0.1, 0.06]} /><meshStandardMaterial color="#333" /></mesh>
    </group>
  );
}

function BookPreview() {
  return (
    <group rotation={[0.2, 0.4, 0.1]}>
      <mesh><boxGeometry args={[0.6, 0.8, 0.15]} /><meshStandardMaterial color="#2196f3" /></mesh>
      <mesh position={[0.02, 0, 0]}><boxGeometry args={[0.58, 0.76, 0.13]} /><meshStandardMaterial color="#fff" /></mesh>
    </group>
  );
}

function PlatePreview() {
  return (
    <group rotation={[0.6, 0, 0]}>
      <mesh><cylinderGeometry args={[0.4, 0.3, 0.04, 24]} /><meshStandardMaterial color="#ffffff" roughness={0.2} /></mesh>
    </group>
  );
}

function RockPreview() {
  return (
    <group rotation={[0.3, 0.5, 0]}>
      <mesh><dodecahedronGeometry args={[0.35, 0]} /><meshStandardMaterial color="#7f8c8d" /></mesh>
    </group>
  );
}

function TeapotPreview() {
  return (
    <group rotation={[0.1, 0.5, 0]}>
      <mesh><sphereGeometry args={[0.3, 16, 16]} /><meshStandardMaterial color="#e74c3c" /></mesh>
      <mesh position={[0.3, 0.1, 0]} rotation={[0, 0, -Math.PI / 4]}><cylinderGeometry args={[0.05, 0.08, 0.25]} /><meshStandardMaterial color="#e74c3c" /></mesh>
      <mesh position={[-0.3, 0, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.15, 0.05, 8, 16, Math.PI]} /><meshStandardMaterial color="#e74c3c" /></mesh>
    </group>
  );
}

function ChairPreview() {
  return (
    <group rotation={[0.3, 0.6, 0]} scale={0.55}>
      <mesh position={[0, 0, 0]}><boxGeometry args={[1, 0.1, 1]} /><meshStandardMaterial color="#8d6e63" /></mesh>
      <mesh position={[-0.4, -0.5, -0.4]}><boxGeometry args={[0.1, 1, 0.1]} /><meshStandardMaterial color="#5d4037" /></mesh>
      <mesh position={[0.4, -0.5, -0.4]}><boxGeometry args={[0.1, 1, 0.1]} /><meshStandardMaterial color="#5d4037" /></mesh>
      <mesh position={[-0.4, -0.5, 0.4]}><boxGeometry args={[0.1, 1, 0.1]} /><meshStandardMaterial color="#5d4037" /></mesh>
      <mesh position={[0.4, -0.5, 0.4]}><boxGeometry args={[0.1, 1, 0.1]} /><meshStandardMaterial color="#5d4037" /></mesh>
      <mesh position={[0, 0.5, -0.45]}><boxGeometry args={[1, 1, 0.1]} /><meshStandardMaterial color="#8d6e63" /></mesh>
    </group>
  );
}

function DeskPreview() {
  return (
    <group rotation={[0.4, 0.5, 0]} scale={0.35}>
      <mesh><boxGeometry args={[2.4, 0.15, 1.2]} /><meshStandardMaterial color="#6d4c41" /></mesh>
      <mesh position={[-1.1, -0.75, -0.5]}><boxGeometry args={[0.15, 1.5, 0.15]} /><meshStandardMaterial color="#3e2723" /></mesh>
      <mesh position={[1.1, -0.75, -0.5]}><boxGeometry args={[0.15, 1.5, 0.15]} /><meshStandardMaterial color="#3e2723" /></mesh>
      <mesh position={[-1.1, -0.75, 0.5]}><boxGeometry args={[0.15, 1.5, 0.15]} /><meshStandardMaterial color="#3e2723" /></mesh>
      <mesh position={[1.1, -0.75, 0.5]}><boxGeometry args={[0.15, 1.5, 0.15]} /><meshStandardMaterial color="#3e2723" /></mesh>
    </group>
  );
}

function ArrowPreview() {
  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <mesh><cylinderGeometry args={[0.02, 0.02, 1]} /><meshStandardMaterial color="#a1887f" /></mesh>
      <mesh position={[0, 0.55, 0]}><coneGeometry args={[0.06, 0.15, 4]} /><meshStandardMaterial color="#9e9e9e" metalness={0.8} /></mesh>
      <mesh position={[0, -0.45, 0]}><boxGeometry args={[0.15, 0.2, 0.01]} /><meshStandardMaterial color="#fff" /></mesh>
    </group>
  );
}

function SwordPreview() {
  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <mesh position={[0, 0.4, 0]}><boxGeometry args={[0.1, 1.2, 0.02]} /><meshStandardMaterial color="#e0e0e0" metalness={0.8} roughness={0.2} /></mesh>
      <mesh position={[0, -0.2, 0]}><boxGeometry args={[0.3, 0.05, 0.05]} /><meshStandardMaterial color="#ffb300" metalness={0.6} /></mesh>
      <mesh position={[0, -0.35, 0]}><cylinderGeometry args={[0.04, 0.04, 0.25]} /><meshStandardMaterial color="#5d4037" /></mesh>
    </group>
  );
}

function HammerPreview() {
  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <mesh position={[0, -0.2, 0]}><cylinderGeometry args={[0.04, 0.04, 0.8]} /><meshStandardMaterial color="#5d4037" /></mesh>
      <mesh position={[0, 0.3, 0]}><boxGeometry args={[0.4, 0.2, 0.2]} /><meshStandardMaterial color="#9e9e9e" metalness={0.7} roughness={0.4} /></mesh>
    </group>
  );
}

function RandomPreview() {
  return (
    <group rotation={[0.3, 0.5, 0]}>
      <mesh><boxGeometry args={[0.5, 0.5, 0.5]} /><meshStandardMaterial color="#ffd700" /></mesh>
      <mesh position={[0, 0, 0.26]}><boxGeometry args={[0.12, 0.12, 0.01]} /><meshStandardMaterial color="#111" /></mesh>
      <mesh position={[0.15, 0.15, 0.26]}><boxGeometry args={[0.08, 0.08, 0.01]} /><meshStandardMaterial color="#111" /></mesh>
      <mesh position={[-0.15, -0.15, 0.26]}><boxGeometry args={[0.08, 0.08, 0.01]} /><meshStandardMaterial color="#111" /></mesh>
    </group>
  );
}

const weaponPreviews: Record<string, () => React.JSX.Element> = {
  random: RandomPreview,
  macaron: MacaronPreview,
  pencil: PencilPreview,
  book: BookPreview,
  plate: PlatePreview,
  rock: RockPreview,
  teapot: TeapotPreview,
  chair: ChairPreview,
  desk: DeskPreview,
  arrow: ArrowPreview,
  sword: SwordPreview,
  hammer: HammerPreview,
  bomb: () => (
    <group rotation={[0.3, 0.5, 0]}>
      <mesh><sphereGeometry args={[0.3, 16, 16]} /><meshStandardMaterial color="#333" /></mesh>
      <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.03, 0.03, 0.15]} /><meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={2} /></mesh>
    </group>
  ),
  freeze: () => (
    <group rotation={[0.3, 0.5, 0]}>
      <mesh><sphereGeometry args={[0.25, 16, 16]} /><meshStandardMaterial color="#81d4fa" emissive="#00bcd4" emissiveIntensity={0.5} transparent opacity={0.8} /></mesh>
      <mesh><octahedronGeometry args={[0.35, 0]} /><meshStandardMaterial color="#e0f7fa" transparent opacity={0.3} wireframe /></mesh>
    </group>
  ),
  banana: () => (
    <group rotation={[0, 0, Math.PI / 6]}>
      <mesh><capsuleGeometry args={[0.1, 0.5, 8, 16]} /><meshStandardMaterial color="#ffe135" /></mesh>
      <mesh position={[0, 0.32, 0]}><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial color="#8d6e63" /></mesh>
    </group>
  ),
};

function WeaponIcon({ weaponKey }: { weaponKey: string }) {
  const Preview = weaponPreviews[weaponKey];
  return (
    <Canvas
      camera={{ position: [0, 0, 2.2], fov: 40 }}
      style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={1.2} />
      <directionalLight position={[2, 3, 4]} intensity={1.5} />
      {Preview && <Preview />}
    </Canvas>
  );
}

export default function WeaponSelector() {
  const selectedWeapon = useGameStore((s) => s.selectedWeapon);
  const setSelectedWeapon = useGameStore((s) => s.setSelectedWeapon);
  const unlockedWeapons = useGameStore((s) => s.unlockedWeapons);
  const coins = useGameStore((s) => s.coins);
  const unlockWeapon = useGameStore((s) => s.unlockWeapon);

  const weapons: WeaponType[] = ['random', 'macaron', 'pencil', 'book', 'plate', 'rock', 'teapot', 'chair', 'desk', 'arrow', 'sword', 'hammer', 'bomb', 'freeze', 'banana'];

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {weapons.map((key) => {
        const isUnlocked = key === 'random' || unlockedWeapons.includes(key as Exclude<WeaponType, 'random'>);
        const selected = selectedWeapon === key;

        // Lock-state pricing & sequential availability for the locked overlay.
        const def = key !== 'random' ? WEAPON_BY_KEY[key as WeaponKey] : undefined;
        const isReady = !isUnlocked && def
          ? isWeaponUnlockReady(key as WeaponKey, unlockedWeapons)
          : false;
        const canBuy = !isUnlocked && def ? isReady && coins >= def.unlockCost : false;

        const tooltip = isUnlocked
          ? `${key}`
          : def
            ? canBuy
              ? `${key} · 클릭해서 ${def.unlockCost} 코인으로 언락`
              : !isReady
                ? `${key} · 이전 자물쇠를 먼저 언락해야 합니다 (${def.unlockCost} 코인)`
                : `${key} · 코인 부족 (${def.unlockCost} 필요 / 보유 ${coins})`
            : `${key} (locked)`;

        const handleClick = () => {
          if (isUnlocked) {
            setSelectedWeapon(key);
            return;
          }
          if (canBuy && def) {
            unlockWeapon(def.key);
          }
        };

        return (
          <button
            key={key}
            onClick={handleClick}
            title={tooltip}
            style={{
              position: 'relative',
              background: selected
                ? 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)'
                : 'linear-gradient(135deg, #555 0%, #333 100%)',
              border: selected
                ? '3px solid #ffd700'
                : canBuy
                  ? '3px solid #4caf50'
                  : '3px solid #111',
              borderRadius: '12px',
              padding: '2px',
              width: '58px',
              height: '58px',
              cursor: isUnlocked || canBuy ? 'pointer' : 'not-allowed',
              boxShadow: selected
                ? '0 0 12px rgba(255,215,0,0.6), inset 2px 2px 0 rgba(0,0,0,0.2)'
                : canBuy
                  ? '0 0 10px rgba(76,175,80,0.55), 3px 3px 0 #000'
                  : '3px 3px 0 #000',
              transform: selected ? 'translate(2px, 2px) scale(1.05)' : 'none',
              transition: 'all 0.15s ease',
              overflow: 'hidden',
              opacity: isUnlocked ? 1 : canBuy ? 0.95 : 0.45,
              filter: isUnlocked ? 'none' : canBuy ? 'none' : 'grayscale(0.7)',
            }}
          >
            <WeaponIcon weaponKey={key} />
            {!isUnlocked && def && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '1px',
                background: canBuy ? 'rgba(46,125,50,0.55)' : 'rgba(0,0,0,0.55)',
                pointerEvents: 'none',
              }}>
                <span style={{
                  fontSize: '18px', lineHeight: 1,
                  textShadow: '1px 1px 0 #000',
                  color: canBuy ? '#ffffff' : '#cccccc',
                }}>
                  🔒
                </span>
                <span style={{
                  fontSize: '11px', fontWeight: 700, lineHeight: 1,
                  color: canBuy ? '#a5ff9a' : '#bbbbbb',
                  textShadow: '1px 1px 0 #000',
                  whiteSpace: 'nowrap',
                }}>
                  🪙{def.unlockCost.toLocaleString()}
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
