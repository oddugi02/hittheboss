'use client';

/**
 * Reusable boss appearance parts shared by Boss.tsx (physics-bound) and
 * BossPreview.tsx (preview-only). The parts here render only visuals — they
 * never touch the rapier rigid bodies. Anchor positions assume the parent
 * group is the boss head/torso, matching the existing Boss/BossPreview
 * coordinate frames.
 *
 * Why share rendering: the customization menu has many options (hat, outfit,
 * mouth, eyebrows, accessory, nose, body type, height) and previously every
 * style branch had to be duplicated in two files. Centralizing here means
 * adding a new option only requires one edit + UI hookup.
 */

import type { BossAppearance } from '../store/gameStore';

// ── Body silhouette helpers ────────────────────────────────────────────────

/**
 * Returns torso/limb scale factors driven by `bodyType`. We deliberately keep
 * colliders fixed and only scale the visual mesh — slight silhouette mismatch
 * with the physics box is acceptable and reads as "stylized" rather than
 * broken. Returning a single object keeps Boss/Preview signatures aligned.
 */
export function bodyScale(bodyType: BossAppearance['bodyType']) {
  switch (bodyType) {
    case 'slim':    return { torsoX: 0.85, torsoY: 1.02, torsoZ: 0.9, armX: 0.85, legX: 0.92 };
    case 'bulky':   return { torsoX: 1.18, torsoY: 1.0,  torsoZ: 1.12, armX: 1.25, legX: 1.1  };
    case 'average':
    default:        return { torsoX: 1.0,  torsoY: 1.0,  torsoZ: 1.0, armX: 1.0,  legX: 1.0  };
  }
}

export function heightScale(height: BossAppearance['height']): number {
  switch (height) {
    case 'short': return 0.92;
    case 'tall':  return 1.08;
    case 'average':
    default:      return 1.0;
  }
}

// ── Hat ────────────────────────────────────────────────────────────────────

/**
 * Renders the headwear sitting on top of the head. Anchor: head-local space
 * (head sphere is radius 0.7 centered at origin, so y≈0.65 is the top crown).
 */
export function HatMesh({ appearance }: { appearance: BossAppearance }) {
  const color = appearance.hatColor || '#f44336';
  switch (appearance.hat) {
    case 'cap':
      return (
        <group position={[0, 0.55, 0]}>
          {/* dome */}
          <mesh>
            <sphereGeometry args={[0.55, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={color} />
          </mesh>
          {/* visor */}
          <mesh position={[0, -0.05, 0.45]} rotation={[Math.PI / 2.4, 0, 0]}>
            <cylinderGeometry args={[0.45, 0.45, 0.05, 24, 1, false, 0, Math.PI]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      );
    case 'crown':
      return (
        <group position={[0, 0.65, 0]}>
          <mesh>
            <cylinderGeometry args={[0.55, 0.55, 0.18, 8]} />
            <meshStandardMaterial color="#ffd700" metalness={0.7} roughness={0.3} />
          </mesh>
          {[0, 1, 2, 3, 4].map((i) => {
            const angle = (Math.PI * 2 * i) / 5;
            return (
              <mesh
                key={i}
                position={[Math.cos(angle) * 0.5, 0.18, Math.sin(angle) * 0.5]}
              >
                <coneGeometry args={[0.07, 0.18, 4]} />
                <meshStandardMaterial color="#ffd700" metalness={0.7} roughness={0.3} />
              </mesh>
            );
          })}
          {/* gem */}
          <mesh position={[0, 0, 0.5]}>
            <octahedronGeometry args={[0.07]} />
            <meshStandardMaterial color="#e91e63" emissive="#ad1457" emissiveIntensity={0.4} />
          </mesh>
        </group>
      );
    case 'tophat':
      return (
        <group position={[0, 0.7, 0]}>
          <mesh position={[0, -0.05, 0]}>
            <cylinderGeometry args={[0.7, 0.7, 0.05, 24]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, 0.32, 0]}>
            <cylinderGeometry args={[0.45, 0.45, 0.7, 24]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, 0, 0.001]}>
            <cylinderGeometry args={[0.46, 0.46, 0.04, 24]} />
            <meshStandardMaterial color="#ffd700" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      );
    case 'partyhat':
      return (
        <group position={[0, 0.65, 0]}>
          <mesh position={[0, 0.4, 0]}>
            <coneGeometry args={[0.45, 0.9, 24]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, 0.92, 0]}>
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
      );
    case 'beanie':
      return (
        <group position={[0, 0.45, 0]}>
          <mesh>
            <sphereGeometry args={[0.55, 24, 18, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
            <meshStandardMaterial color={color} roughness={0.95} />
          </mesh>
          {/* fold band */}
          <mesh position={[0, -0.18, 0]}>
            <cylinderGeometry args={[0.55, 0.55, 0.16, 24]} />
            <meshStandardMaterial color={color} roughness={0.95} />
          </mesh>
          {/* pom-pom */}
          <mesh position={[0, 0.5, 0]}>
            <sphereGeometry args={[0.13, 12, 12]} />
            <meshStandardMaterial color="#ffffff" roughness={1} />
          </mesh>
        </group>
      );
    case 'horns':
      return (
        <group position={[0, 0.5, 0]}>
          <mesh position={[-0.32, 0.25, 0]} rotation={[0, 0, -0.35]}>
            <coneGeometry args={[0.1, 0.5, 12]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.4} />
          </mesh>
          <mesh position={[0.32, 0.25, 0]} rotation={[0, 0, 0.35]}>
            <coneGeometry args={[0.1, 0.5, 12]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.4} />
          </mesh>
        </group>
      );
    case 'halo':
      return (
        <group position={[0, 0.95, 0]} rotation={[Math.PI / 2.4, 0, 0]}>
          <mesh>
            <torusGeometry args={[0.4, 0.05, 12, 32]} />
            <meshStandardMaterial color="#fff59d" emissive="#ffd54f" emissiveIntensity={0.8} />
          </mesh>
        </group>
      );
    case 'none':
    default:
      return null;
  }
}

// ── Eyebrows ───────────────────────────────────────────────────────────────

export function EyebrowsMesh({
  appearance,
  leftRot,
  rightRot,
}: {
  appearance: BossAppearance;
  leftRot: number;
  rightRot: number;
}) {
  const baldColor = appearance.hairStyle === 'bald' ? appearance.skinColor : appearance.hairColor;
  const params = (() => {
    switch (appearance.eyebrowStyle) {
      case 'bushy':   return { sx: 0.26, sy: 0.10, sz: 0.08 };
      case 'thin':    return { sx: 0.22, sy: 0.025, sz: 0.05 };
      case 'unibrow': return { sx: 0, sy: 0, sz: 0 }; // single bar rendered separately
      case 'normal':
      default:        return { sx: 0.22, sy: 0.06, sz: 0.06 };
    }
  })();

  if (appearance.eyebrowStyle === 'unibrow') {
    return (
      <mesh position={[0, 0.3, 0.66]}>
        <boxGeometry args={[0.6, 0.08, 0.06]} />
        <meshStandardMaterial color={baldColor} />
      </mesh>
    );
  }

  return (
    <>
      <mesh position={[-0.22, 0.3, 0.66]} rotation={[0, 0, leftRot]}>
        <boxGeometry args={[params.sx, params.sy, params.sz]} />
        <meshStandardMaterial color={baldColor} />
      </mesh>
      <mesh position={[0.22, 0.3, 0.66]} rotation={[0, 0, rightRot]}>
        <boxGeometry args={[params.sx, params.sy, params.sz]} />
        <meshStandardMaterial color={baldColor} />
      </mesh>
    </>
  );
}

// ── Mouth ──────────────────────────────────────────────────────────────────

export function MouthMesh({
  appearance,
  phase,
}: {
  appearance: BossAppearance;
  phase: 'normal' | 'angry' | 'hurt' | 'fainted';
}) {
  // Damage-driven phase mouths take precedence — the static style only shows
  // while the boss is calm.
  if (phase === 'angry') {
    return (
      <mesh position={[0, -0.2, 0.66]}>
        <boxGeometry args={[0.3, 0.1, 0.04]} />
        <meshStandardMaterial color="#4a0000" />
      </mesh>
    );
  }
  if (phase === 'hurt' || phase === 'fainted') {
    return (
      <mesh position={[0, -0.25, 0.66]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.04, 16]} />
        <meshStandardMaterial color="#4a0000" />
      </mesh>
    );
  }
  switch (appearance.mouthStyle) {
    case 'smile':
      return (
        <group position={[0, -0.22, 0.66]}>
          <mesh rotation={[0, 0, 0.4]} position={[-0.08, 0.02, 0]}>
            <boxGeometry args={[0.14, 0.04, 0.04]} />
            <meshStandardMaterial color="#a0522d" />
          </mesh>
          <mesh rotation={[0, 0, -0.4]} position={[0.08, 0.02, 0]}>
            <boxGeometry args={[0.14, 0.04, 0.04]} />
            <meshStandardMaterial color="#a0522d" />
          </mesh>
        </group>
      );
    case 'smirk':
      return (
        <mesh position={[0.05, -0.2, 0.66]} rotation={[0, 0, 0.25]}>
          <boxGeometry args={[0.22, 0.04, 0.04]} />
          <meshStandardMaterial color="#a0522d" />
        </mesh>
      );
    case 'grin':
      return (
        <group position={[0, -0.22, 0.66]}>
          <mesh>
            <boxGeometry args={[0.32, 0.12, 0.04]} />
            <meshStandardMaterial color="#3a0a00" />
          </mesh>
          {/* teeth */}
          <mesh position={[0, 0.02, 0.02]}>
            <boxGeometry args={[0.3, 0.04, 0.02]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
      );
    case 'frown':
      return (
        <group position={[0, -0.18, 0.66]}>
          <mesh rotation={[0, 0, -0.4]} position={[-0.08, -0.02, 0]}>
            <boxGeometry args={[0.14, 0.04, 0.04]} />
            <meshStandardMaterial color="#a0522d" />
          </mesh>
          <mesh rotation={[0, 0, 0.4]} position={[0.08, -0.02, 0]}>
            <boxGeometry args={[0.14, 0.04, 0.04]} />
            <meshStandardMaterial color="#a0522d" />
          </mesh>
        </group>
      );
    case 'neutral':
    default:
      return (
        <mesh position={[0, -0.2, 0.66]}>
          <boxGeometry args={[0.25, 0.04, 0.04]} />
          <meshStandardMaterial color="#a0522d" />
        </mesh>
      );
  }
}

// ── Nose ───────────────────────────────────────────────────────────────────

export function NoseMesh({ appearance }: { appearance: BossAppearance }) {
  const skin = appearance.skinColor;
  switch (appearance.noseStyle) {
    case 'small':
      return (
        <mesh position={[0, 0.0, 0.7]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color={skin} />
        </mesh>
      );
    case 'big':
      return (
        <mesh position={[0, 0.0, 0.74]}>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial color={skin} />
        </mesh>
      );
    case 'pointy':
      return (
        <mesh position={[0, -0.01, 0.78]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.07, 0.22, 12]} />
          <meshStandardMaterial color={skin} />
        </mesh>
      );
    case 'normal':
    default:
      return (
        <mesh position={[0, 0.0, 0.72]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color={skin} />
        </mesh>
      );
  }
}

// ── Face accessory (eyepatch / scar / mole / mask / bandage) ──────────────

export function FaceAccessoryMesh({ appearance }: { appearance: BossAppearance }) {
  switch (appearance.faceAccessory) {
    case 'eyepatch':
      return (
        <group>
          {/* patch over right eye */}
          <mesh position={[0.22, 0.15, 0.7]}>
            <boxGeometry args={[0.28, 0.22, 0.02]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          {/* strap */}
          <mesh position={[0, 0.18, 0.55]} rotation={[0, 0, -0.15]}>
            <boxGeometry args={[1.5, 0.04, 0.02]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        </group>
      );
    case 'scar':
      return (
        <mesh position={[-0.28, 0.05, 0.66]} rotation={[0, 0, 0.4]}>
          <boxGeometry args={[0.04, 0.4, 0.02]} />
          <meshStandardMaterial color="#a13a3a" />
        </mesh>
      );
    case 'mole':
      return (
        <mesh position={[0.25, -0.18, 0.66]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color="#3e1f0f" />
        </mesh>
      );
    case 'mask':
      // surgical mask covering nose+mouth
      return (
        <mesh position={[0, -0.18, 0.65]}>
          <boxGeometry args={[0.6, 0.4, 0.04]} />
          <meshStandardMaterial color="#e3f2fd" />
        </mesh>
      );
    case 'bandage':
      return (
        <group position={[-0.05, 0.05, 0.66]}>
          <mesh>
            <boxGeometry args={[0.28, 0.08, 0.02]} />
            <meshStandardMaterial color="#fff8e1" />
          </mesh>
          {/* cross */}
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.12, 0.02, 0.025]} />
            <meshStandardMaterial color="#bcaaa4" />
          </mesh>
          <mesh rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[0.12, 0.02, 0.025]} />
            <meshStandardMaterial color="#bcaaa4" />
          </mesh>
        </group>
      );
    case 'none':
    default:
      return null;
  }
}

// ── Facial Hair ────────────────────────────────────────────────────────────

export function FacialHairMesh({ appearance }: { appearance: BossAppearance }) {
  if (appearance.facialHair === 'none') return null;
  if (appearance.facialHair === 'mustache') {
    return (
      <mesh position={[0, -0.08, 0.68]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.35, 8]} />
        <meshStandardMaterial color={appearance.hairColor} />
      </mesh>
    );
  }
  if (appearance.facialHair === 'beard') {
    return (
      <>
        <mesh position={[0, -0.08, 0.68]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 0.35, 8]} />
          <meshStandardMaterial color={appearance.hairColor} />
        </mesh>
        <mesh position={[0, -0.35, 0.6]}>
          <boxGeometry args={[0.4, 0.2, 0.15]} />
          <meshStandardMaterial color={appearance.hairColor} />
        </mesh>
      </>
    );
  }
  if (appearance.facialHair === 'goatee') {
    return (
      <mesh position={[0, -0.32, 0.62]}>
        <coneGeometry args={[0.08, 0.18, 12]} />
        <meshStandardMaterial color={appearance.hairColor} />
      </mesh>
    );
  }
  if (appearance.facialHair === 'stubble') {
    // tiny dotted grid below mouth
    const dots: { x: number; y: number }[] = [];
    for (let i = -2; i <= 2; i++) {
      for (let j = 0; j < 2; j++) {
        dots.push({ x: i * 0.08, y: -0.32 - j * 0.08 });
      }
    }
    return (
      <>
        {dots.map((d, i) => (
          <mesh key={i} position={[d.x, d.y, 0.66]}>
            <sphereGeometry args={[0.018, 6, 6]} />
            <meshStandardMaterial color={appearance.hairColor} />
          </mesh>
        ))}
      </>
    );
  }
  return null;
}

// ── Outfit (replaces the basic shirt mesh) ─────────────────────────────────

/**
 * Renders the torso geometry based on outfit style. Returned JSX is meant to
 * sit at the torso group origin (matching the existing single-mesh shirt).
 *
 * Notes on `damageLevel` interactions: existing Boss.tsx hides the tie/collar
 * once damage is high. Outfits above 'suit' don't include those, so the boss
 * progressively de-suits naturally as it takes damage.
 */
export function OutfitMesh({
  appearance,
  damageLevel,
}: {
  appearance: BossAppearance;
  damageLevel: number;
}) {
  const { gender, outfit, shirtColor, pantsColor } = appearance;
  // The original "suit" path differs by gender (female has a separate skirt)
  const showCollar = damageLevel < 3;
  const showTie = damageLevel < 2;

  switch (outfit) {
    case 'casual':
      return (
        <>
          {gender === 'female' ? (
            <group>
              <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
                <boxGeometry args={[0.95, 1.0, 0.62]} />
                <meshStandardMaterial color={shirtColor} roughness={0.85} />
              </mesh>
              <mesh castShadow receiveShadow position={[0, -0.4, 0]} rotation={[0, Math.PI / 4, 0]}>
                <cylinderGeometry args={[0.45, 0.6, 0.4, 4]} />
                <meshStandardMaterial color={pantsColor} roughness={0.85} />
              </mesh>
            </group>
          ) : (
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1.1, 1.2, 0.7]} />
              <meshStandardMaterial color={shirtColor} roughness={0.85} />
            </mesh>
          )}
          {/* casual round neckline */}
          <mesh position={[0, 0.5, 0.35]}>
            <torusGeometry args={[0.18, 0.04, 8, 16, Math.PI]} />
            <meshStandardMaterial color={shirtColor} roughness={0.9} />
          </mesh>
        </>
      );
    case 'tracksuit':
      return (
        <>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.1, 1.2, 0.7]} />
            <meshStandardMaterial color={shirtColor} roughness={0.85} />
          </mesh>
          {/* zipper */}
          <mesh position={[0, 0, 0.36]}>
            <boxGeometry args={[0.04, 1.0, 0.02]} />
            <meshStandardMaterial color="#cccccc" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* side stripes */}
          <mesh position={[-0.55, 0, 0]}>
            <boxGeometry args={[0.04, 1.0, 0.72]} />
            <meshStandardMaterial color="#ffffff" roughness={0.7} />
          </mesh>
          <mesh position={[0.55, 0, 0]}>
            <boxGeometry args={[0.04, 1.0, 0.72]} />
            <meshStandardMaterial color="#ffffff" roughness={0.7} />
          </mesh>
        </>
      );
    case 'hoodie':
      return (
        <>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.15, 1.25, 0.72]} />
            <meshStandardMaterial color={shirtColor} roughness={0.95} />
          </mesh>
          {/* front pocket */}
          <mesh position={[0, -0.15, 0.36]}>
            <boxGeometry args={[0.7, 0.35, 0.04]} />
            <meshStandardMaterial color={shirtColor} roughness={1} />
          </mesh>
          {/* drawstrings */}
          <mesh position={[-0.08, 0.55, 0.36]}>
            <cylinderGeometry args={[0.018, 0.018, 0.25, 6]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.08, 0.55, 0.36]}>
            <cylinderGeometry args={[0.018, 0.018, 0.25, 6]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </>
      );
    case 'royal':
      return (
        <>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.1, 1.2, 0.7]} />
            <meshStandardMaterial color={shirtColor} roughness={0.7} metalness={0.15} />
          </mesh>
          {/* gold trim down the middle */}
          <mesh position={[0, 0, 0.36]}>
            <boxGeometry args={[0.12, 1.1, 0.02]} />
            <meshStandardMaterial color="#ffd700" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* shoulder epaulettes */}
          <mesh position={[-0.55, 0.5, 0]}>
            <boxGeometry args={[0.18, 0.08, 0.7]} />
            <meshStandardMaterial color="#ffd700" metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh position={[0.55, 0.5, 0]}>
            <boxGeometry args={[0.18, 0.08, 0.7]} />
            <meshStandardMaterial color="#ffd700" metalness={0.7} roughness={0.35} />
          </mesh>
          {/* cape behind */}
          <mesh position={[0, -0.05, -0.4]}>
            <boxGeometry args={[1.0, 1.5, 0.04]} />
            <meshStandardMaterial color="#b71c1c" roughness={0.8} side={2} />
          </mesh>
        </>
      );
    case 'suit':
    default:
      return (
        <>
          {gender === 'female' ? (
            <group>
              <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
                <boxGeometry args={[0.9, 1.0, 0.6]} />
                <meshStandardMaterial color={shirtColor} roughness={0.85} />
              </mesh>
              <mesh castShadow receiveShadow position={[0, -0.4, 0]} rotation={[0, Math.PI / 4, 0]}>
                <cylinderGeometry args={[0.45, 0.6, 0.4, 4]} />
                <meshStandardMaterial color={pantsColor} roughness={0.85} />
              </mesh>
            </group>
          ) : (
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1.1, 1.2, 0.7]} />
              <meshStandardMaterial color={shirtColor} roughness={0.85} />
            </mesh>
          )}
          {showTie && appearance.tieStyle === 'long' && (
            <mesh position={[0, 0, 0.36]}>
              <planeGeometry args={[0.18, 0.9]} />
              <meshStandardMaterial color={appearance.tieColor || '#e63946'} roughness={0.8} side={2} />
            </mesh>
          )}
          {showTie && appearance.tieStyle === 'bowtie' && (
            <group position={[0, 0.35, 0.36]}>
              <mesh position={[-0.1, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
                <planeGeometry args={[0.15, 0.15]} />
                <meshStandardMaterial color={appearance.tieColor || '#e63946'} side={2} />
              </mesh>
              <mesh position={[0.1, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
                <planeGeometry args={[0.15, 0.15]} />
                <meshStandardMaterial color={appearance.tieColor || '#e63946'} side={2} />
              </mesh>
              <mesh position={[0, 0, 0.01]}>
                <planeGeometry args={[0.08, 0.08]} />
                <meshStandardMaterial color={appearance.tieColor || '#e63946'} side={2} />
              </mesh>
            </group>
          )}
          {showCollar && (
            <mesh position={[0, 0.45, 0.36]}>
              <planeGeometry args={[0.45, 0.15]} />
              <meshStandardMaterial color="#ffffff" roughness={0.8} side={2} />
            </mesh>
          )}
        </>
      );
  }
}
