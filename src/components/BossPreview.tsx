'use client';

import { useGameStore } from '../store/gameStore';
import { Text } from '@react-three/drei';
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

export default function BossPreview({ showName = true }: { showName?: boolean }) {
  const appearance = useGameStore((s) => s.appearance);
  const recentDamage = useGameStore((s) => s.recentDamage);

  let phase: 'normal' | 'angry' | 'hurt' | 'fainted' = 'normal';
  if (recentDamage >= 3000) phase = 'fainted';
  else if (recentDamage >= 1500) phase = 'hurt';
  else if (recentDamage >= 500) phase = 'angry';

  const leftEyebrowRot = phase === 'angry' ? -0.7 : phase === 'hurt' || phase === 'fainted' ? 0.4 : -0.35;
  const rightEyebrowRot = phase === 'angry' ? 0.7 : phase === 'hurt' || phase === 'fainted' ? -0.4 : 0.35;

  const bs = bodyScale(appearance.bodyType);
  const hs = heightScale(appearance.height);
  // Damage-progression for outfit: BossPreview always renders the boss in
  // pristine condition since the customizer focuses on look, not combat damage.
  const damageLevel = 0;

  return (
    <group position={[0, -1.5, 0]} scale={[1, hs, 1]}>
      {/* ── Torso ── */}
      <group position={[0, 3.5, 0]} scale={[bs.torsoX, bs.torsoY, bs.torsoZ]}>
        <OutfitMesh appearance={appearance} damageLevel={damageLevel} />
      </group>

      {/* ── Head ── */}
      <group position={[0, 4.9, 0]}>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.7, 24, 24]} />
          <meshStandardMaterial color={appearance.skinColor} roughness={0.5} />
        </mesh>

        {/* Floating Name Tag */}
        {showName && appearance.name && (
          <Text
            position={[0, 1.2, 0]}
            fontSize={0.4}
            color="#ff4500"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.03}
            outlineColor="#ffffff"
          >
            {appearance.name.toUpperCase()}
          </Text>
        )}

        {/* Hat */}
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
          // Mirror the in-game spiky redesign from Boss.tsx: shorter dome cap
          // plus 5 spikes raised to clear the dome from every viewing angle.
          <group>
            <mesh position={[0, 0.2, 0]}>
              <sphereGeometry args={[0.72, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2.6]} />
              <meshStandardMaterial color={appearance.hairColor} roughness={0.9} />
            </mesh>
            <mesh position={[0, 1.0, 0]}>
              <coneGeometry args={[0.18, 0.6, 4]} />
              <meshStandardMaterial color={appearance.hairColor} roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.85, 0.28]} rotation={[0.45, 0, 0]}>
              <coneGeometry args={[0.14, 0.5, 4]} />
              <meshStandardMaterial color={appearance.hairColor} roughness={0.9} />
            </mesh>
            <mesh position={[-0.34, 0.85, 0.05]} rotation={[0, 0, 0.55]}>
              <coneGeometry args={[0.14, 0.5, 4]} />
              <meshStandardMaterial color={appearance.hairColor} roughness={0.9} />
            </mesh>
            <mesh position={[0.34, 0.85, 0.05]} rotation={[0, 0, -0.55]}>
              <coneGeometry args={[0.14, 0.5, 4]} />
              <meshStandardMaterial color={appearance.hairColor} roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.82, -0.28]} rotation={[-0.45, 0, 0]}>
              <coneGeometry args={[0.13, 0.45, 4]} />
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
            <mesh position={[0, 0.6, -0.1]} rotation={[Math.PI / 8, 0, 0]}>
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
            <mesh position={[-0.7, 0.45, -0.1]} rotation={[0, 0, Math.PI / 2.5]}>
              <cylinderGeometry args={[0.08, 0.08, 0.1]} />
              <meshStandardMaterial color="#e63946" />
            </mesh>
            <mesh position={[0.7, 0.45, -0.1]} rotation={[0, 0, -Math.PI / 2.5]}>
              <cylinderGeometry args={[0.08, 0.08, 0.1]} />
              <meshStandardMaterial color="#e63946" />
            </mesh>
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
        {phase !== 'fainted' ? (
          <>
            <mesh position={[-0.22, 0.15, 0.62]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial color="white" />
              <mesh position={[0, 0, 0.1]}>
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshStandardMaterial color={appearance.eyeColor} />
              </mesh>
            </mesh>
            <mesh position={[0.22, 0.15, 0.62]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial color="white" />
              <mesh position={[0, 0, 0.1]}>
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshStandardMaterial color={appearance.eyeColor} />
              </mesh>
            </mesh>
          </>
        ) : (
          <>
            <group position={[-0.22, 0.15, 0.65]}>
              <mesh rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.2, 0.04, 0.02]} /><meshStandardMaterial color="#111" /></mesh>
              <mesh rotation={[0, 0, -Math.PI / 4]}><boxGeometry args={[0.2, 0.04, 0.02]} /><meshStandardMaterial color="#111" /></mesh>
            </group>
            <group position={[0.22, 0.15, 0.65]}>
              <mesh rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.2, 0.04, 0.02]} /><meshStandardMaterial color="#111" /></mesh>
              <mesh rotation={[0, 0, -Math.PI / 4]}><boxGeometry args={[0.2, 0.04, 0.02]} /><meshStandardMaterial color="#111" /></mesh>
            </group>
          </>
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
            <mesh position={[-0.35, 0, -0.2]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[0.4, 0.02, 0.02]} /><meshStandardMaterial color="#111" /></mesh>
            <mesh position={[0.35, 0, -0.2]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[0.4, 0.02, 0.02]} /><meshStandardMaterial color="#111" /></mesh>
          </group>
        )}

        <EyebrowsMesh appearance={appearance} leftRot={leftEyebrowRot} rightRot={rightEyebrowRot} />
        <NoseMesh appearance={appearance} />
        <MouthMesh appearance={appearance} phase={phase} />
        <FaceAccessoryMesh appearance={appearance} />

        {/* Tears (Hurt/Fainted) */}
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

        {/* Bruises (Hurt/Fainted) */}
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

      {/* ── Left Arm ── */}
      <group position={[-0.85, 3.2, 0]} scale={[bs.armX, 1, 1]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.3, 0.8, 0.3]} />
          <meshStandardMaterial color={appearance.shirtColor} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.5, 0]}>
          <sphereGeometry args={[0.18, 12, 12]} />
          <meshStandardMaterial color={appearance.skinColor} roughness={0.5} />
        </mesh>
      </group>

      {/* ── Right Arm ── */}
      <group position={[0.85, 3.2, 0]} scale={[bs.armX, 1, 1]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.3, 0.8, 0.3]} />
          <meshStandardMaterial color={appearance.shirtColor} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.5, 0]}>
          <sphereGeometry args={[0.18, 12, 12]} />
          <meshStandardMaterial color={appearance.skinColor} roughness={0.5} />
        </mesh>
      </group>

      {/* ── Left Leg ── */}
      <group position={[-0.25, 2.0, 0]} scale={[bs.legX, 1, 1]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.4, 1.0, 0.4]} />
          <meshStandardMaterial color={appearance.pantsColor} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.6, 0.08]}>
          <boxGeometry args={[0.42, 0.25, 0.55]} />
          <meshStandardMaterial color={appearance.shoeColor} roughness={0.85} />
        </mesh>
      </group>

      {/* ── Right Leg ── */}
      <group position={[0.25, 2.0, 0]} scale={[bs.legX, 1, 1]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.4, 1.0, 0.4]} />
          <meshStandardMaterial color={appearance.pantsColor} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.6, 0.08]}>
          <boxGeometry args={[0.42, 0.25, 0.55]} />
          <meshStandardMaterial color={appearance.shoeColor} roughness={0.85} />
        </mesh>
      </group>
    </group>
  );
}
