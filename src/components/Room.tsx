'use client';

import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useGameStore } from '../store/gameStore';

// ── Theme configs ──
const themes = {
  office: {
    floor: '#c49a6c',
    backWall: '#f5ead6',
    sideWall: '#efe3cf',
    baseboard: '#7a4a2a',
    clearColor: '#e8dcc8',
  },
  classroom: {
    floor: '#b8a590',
    backWall: '#d4e6c3',
    sideWall: '#cce0bb',
    baseboard: '#5d4037',
    clearColor: '#c8d8b8',
  },
  room: {
    floor: '#dbc1a0',
    backWall: '#f0d4e8',
    sideWall: '#e8c8e0',
    baseboard: '#8d6e63',
    clearColor: '#e8d0e0',
  },
  outside: {
    floor: '#6b8f3c',
    backWall: '#87ceeb',
    sideWall: '#87ceeb',
    baseboard: '#5d4037',
    clearColor: '#87ceeb',
  },
};

// ── Decorations per theme ──

function OfficeDecorations() {
  return (
    <group>
      {/* Whiteboard */}
      <mesh position={[0, 5, -5.8]}>
        <boxGeometry args={[4, 2.5, 0.1]} />
        <meshStandardMaterial color="#f8f8f8" roughness={0.3} />
      </mesh>
      <mesh position={[0, 5, -5.85]}>
        <boxGeometry args={[4.2, 2.7, 0.05]} />
        <meshStandardMaterial color="#666" />
      </mesh>
      {/* Desk */}
      <mesh receiveShadow position={[4, 1.2, -3]}>
        <boxGeometry args={[3, 0.12, 1.5]} />
        <meshStandardMaterial color="#6d4c41" roughness={0.8} />
      </mesh>
      {[[-1.3, -3.6], [1.3, -3.6], [-1.3, -2.3], [1.3, -2.3]].map(([dx, dz], i) => (
        <mesh key={i} position={[4 + dx, 0.6, dz]} receiveShadow>
          <boxGeometry args={[0.1, 1.2, 0.1]} />
          <meshStandardMaterial color="#5d4037" />
        </mesh>
      ))}
      {/* Water cooler */}
      <mesh position={[-6, 1.5, -4]}>
        <boxGeometry args={[0.6, 2.5, 0.5]} />
        <meshStandardMaterial color="#cfd8dc" roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[-6, 3, -4]}>
        <cylinderGeometry args={[0.25, 0.25, 0.6, 16]} />
        <meshStandardMaterial color="#b3e5fc" transparent opacity={0.7} />
      </mesh>
      {/* Clock */}
      <mesh position={[5, 7, -5.8]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.1, 24]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      <mesh position={[5, 7, -5.72]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 0.05, 24]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* Filing cabinet */}
      <mesh position={[-6.5, 1.5, -1]}>
        <boxGeometry args={[1, 3, 0.8]} />
        <meshStandardMaterial color="#78909c" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[-6.5, 2.2, -0.57]}>
        <boxGeometry args={[0.3, 0.05, 0.05]} />
        <meshStandardMaterial color="#455a64" metalness={0.8} />
      </mesh>
      <mesh position={[-6.5, 1.2, -0.57]}>
        <boxGeometry args={[0.3, 0.05, 0.05]} />
        <meshStandardMaterial color="#455a64" metalness={0.8} />
      </mesh>
    </group>
  );
}

function ClassroomDecorations() {
  return (
    <group>
      {/* Blackboard */}
      <mesh position={[0, 5, -5.8]}>
        <boxGeometry args={[6, 3, 0.1]} />
        <meshStandardMaterial color="#2e5b3a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 5, -5.85]}>
        <boxGeometry args={[6.3, 3.3, 0.05]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      {/* Chalk tray */}
      <mesh position={[0, 3.35, -5.65]}>
        <boxGeometry args={[5.5, 0.1, 0.15]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      {/* Student desks - row 1 */}
      {[-4, 0, 4].map((x, i) => (
        <group key={i}>
          <mesh receiveShadow position={[x, 1, 2]}>
            <boxGeometry args={[1.8, 0.08, 1]} />
            <meshStandardMaterial color="#a1887f" roughness={0.8} />
          </mesh>
          {[[-0.8, 1.5], [0.8, 1.5], [-0.8, 2.5], [0.8, 2.5]].map(([dx, dz], j) => (
            <mesh key={j} position={[x + dx, 0.5, dz]} receiveShadow>
              <boxGeometry args={[0.06, 1, 0.06]} />
              <meshStandardMaterial color="#795548" />
            </mesh>
          ))}
        </group>
      ))}
      {/* Globe on teacher desk */}
      <mesh position={[5, 2.2, -3.5]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#4fc3f7" roughness={0.6} />
      </mesh>
      <mesh position={[5, 1.8, -3.5]}>
        <cylinderGeometry args={[0.05, 0.15, 0.3]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      {/* Teacher desk */}
      <mesh receiveShadow position={[5, 1.2, -3.5]}>
        <boxGeometry args={[2.5, 0.12, 1.5]} />
        <meshStandardMaterial color="#6d4c41" roughness={0.8} />
      </mesh>
    </group>
  );
}

function RoomDecorations() {
  return (
    <group>
      {/* Bed */}
      <mesh receiveShadow position={[-5, 0.8, -3]}>
        <boxGeometry args={[3, 1.2, 4]} />
        <meshStandardMaterial color="#e8d5e0" roughness={0.9} />
      </mesh>
      {/* Pillow */}
      <mesh position={[-5, 1.5, -4.5]}>
        <boxGeometry args={[2, 0.4, 0.8]} />
        <meshStandardMaterial color="#fff" roughness={0.9} />
      </mesh>
      {/* Blanket */}
      <mesh position={[-5, 1.45, -2]}>
        <boxGeometry args={[2.8, 0.15, 2.5]} />
        <meshStandardMaterial color="#ce93d8" roughness={0.9} />
      </mesh>
      {/* Bookshelf */}
      <mesh position={[6, 3, -5]}>
        <boxGeometry args={[2.5, 5, 0.8]} />
        <meshStandardMaterial color="#795548" roughness={0.8} />
      </mesh>
      {/* Books on shelf */}
      {[1.5, 0.5, -0.5, -1.5].map((y, i) => (
        <mesh key={i} position={[6, 3 + y, -4.5]}>
          <boxGeometry args={[2, 0.6, 0.5]} />
          <meshStandardMaterial color={['#e57373', '#64b5f6', '#81c784', '#ffb74d'][i]} />
        </mesh>
      ))}
      {/* Poster on wall */}
      <mesh position={[-2, 6, -5.8]}>
        <boxGeometry args={[1.8, 2.5, 0.05]} />
        <meshStandardMaterial color="#fff59d" />
      </mesh>
      {/* Small desk with lamp */}
      <mesh receiveShadow position={[4, 1.2, 0]}>
        <boxGeometry args={[2, 0.1, 1.2]} />
        <meshStandardMaterial color="#a1887f" roughness={0.8} />
      </mesh>
      {/* Lamp */}
      <mesh position={[4.5, 1.8, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[4.5, 2.35, 0]}>
        <coneGeometry args={[0.3, 0.3, 8, 1, true]} />
        <meshStandardMaterial color="#ffeb3b" side={2} />
      </mesh>
      {/* Rug */}
      <mesh receiveShadow position={[0, 0.01, 1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5, 4]} />
        <meshStandardMaterial color="#ce93d8" roughness={0.95} />
      </mesh>
    </group>
  );
}

function OutsideDecorations() {
  return (
    <group>
      {/* Trees */}
      {[-6, -3, 4, 7].map((x, i) => (
        <group key={i} position={[x, 0, -4 + i * 0.5]}>
          {/* Trunk */}
          <mesh position={[0, 2, 0]}>
            <cylinderGeometry args={[0.2, 0.3, 4]} />
            <meshStandardMaterial color="#6d4c41" roughness={0.9} />
          </mesh>
          {/* Leaves */}
          <mesh position={[0, 4.5, 0]}>
            <sphereGeometry args={[1.2 + i * 0.15, 8, 8]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#388e3c' : '#43a047'} roughness={0.9} />
          </mesh>
          <mesh position={[0.5, 5, 0.3]}>
            <sphereGeometry args={[0.9 + i * 0.1, 8, 8]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#43a047' : '#2e7d32'} roughness={0.9} />
          </mesh>
        </group>
      ))}
      {/* Bench */}
      <mesh receiveShadow position={[0, 0.7, 2]}>
        <boxGeometry args={[3, 0.12, 0.6]} />
        <meshStandardMaterial color="#8d6e63" roughness={0.8} />
      </mesh>
      {[[-1.2, 0.35, 2], [1.2, 0.35, 2]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} receiveShadow>
          <boxGeometry args={[0.12, 0.7, 0.5]} />
          <meshStandardMaterial color="#6d4c41" />
        </mesh>
      ))}
      {/* Clouds */}
      {[[-4, 9, -5], [3, 10, -4], [7, 8.5, -5]].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh>
            <sphereGeometry args={[1, 8, 8]} />
            <meshStandardMaterial color="#fff" roughness={0.9} />
          </mesh>
          <mesh position={[0.8, 0.2, 0]}>
            <sphereGeometry args={[0.7, 8, 8]} />
            <meshStandardMaterial color="#fff" roughness={0.9} />
          </mesh>
          <mesh position={[-0.6, 0.1, 0]}>
            <sphereGeometry args={[0.6, 8, 8]} />
            <meshStandardMaterial color="#fff" roughness={0.9} />
          </mesh>
        </group>
      ))}
      {/* Flower patches */}
      {[[-2, 0.15, 3], [2, 0.15, 4], [5, 0.15, 3.5], [-5, 0.15, 4]].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh>
            <cylinderGeometry args={[0.08, 0.02, 0.3]} />
            <meshStandardMaterial color="#4caf50" />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color={['#e91e63', '#ffeb3b', '#ff5722', '#9c27b0'][i]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function Room() {
  const background = useGameStore((s) => s.background);
  const t = themes[background];

  return (
    <group>
      {/* Floor */}
      <RigidBody type="fixed" friction={1} restitution={0.2}>
        <CuboidCollider args={[25, 5, 25]} position={[0, -5.05, 0]} />
        <mesh receiveShadow position={[0, -0.05, 0]}>
          <boxGeometry args={[30, 0.1, 30]} />
          <meshStandardMaterial color={t.floor} roughness={0.9} metalness={0} />
        </mesh>
      </RigidBody>

      {/* Back Wall */}
      <RigidBody type="fixed">
        <CuboidCollider args={[25, 20, 5]} position={[0, 10, -11]} />
        <mesh receiveShadow position={[0, 5, -7]}>
          <boxGeometry args={[30, 20, 2]} />
          <meshStandardMaterial color={t.backWall} roughness={0.95} metalness={0} />
        </mesh>
      </RigidBody>

      {/* Left Wall */}
      <RigidBody type="fixed">
        <CuboidCollider args={[5, 20, 25]} position={[-13, 10, 0]} />
        <mesh receiveShadow position={[-9, 5, 0]}>
          <boxGeometry args={[2, 20, 30]} />
          <meshStandardMaterial color={t.sideWall} roughness={0.95} metalness={0} />
        </mesh>
      </RigidBody>

      {/* Right Wall */}
      <RigidBody type="fixed">
        <CuboidCollider args={[5, 20, 25]} position={[13, 10, 0]} />
        <mesh receiveShadow position={[9, 5, 0]}>
          <boxGeometry args={[2, 20, 30]} />
          <meshStandardMaterial color={t.sideWall} roughness={0.95} metalness={0} />
        </mesh>
      </RigidBody>

      {/* Invisible Front Wall & Ceiling */}
      <RigidBody type="fixed">
        <CuboidCollider args={[25, 20, 5]} position={[0, 10, 16]} />
      </RigidBody>
      <RigidBody type="fixed">
        <CuboidCollider args={[25, 5, 25]} position={[0, 20, 0]} />
      </RigidBody>

      {/* Baseboard */}
      {background !== 'outside' && (
        <>
          <mesh receiveShadow position={[0, 0.3, -5.85]}>
            <boxGeometry args={[30, 0.6, 0.1]} />
            <meshStandardMaterial color={t.baseboard} roughness={0.9} metalness={0} />
          </mesh>
          <mesh receiveShadow position={[-7.85, 0.3, 0]}>
            <boxGeometry args={[0.1, 0.6, 30]} />
            <meshStandardMaterial color={t.baseboard} roughness={0.9} metalness={0} />
          </mesh>
          <mesh receiveShadow position={[7.85, 0.3, 0]}>
            <boxGeometry args={[0.1, 0.6, 30]} />
            <meshStandardMaterial color={t.baseboard} roughness={0.9} metalness={0} />
          </mesh>
        </>
      )}

      {/* Decorations per theme */}
      {background === 'office' && <OfficeDecorations />}
      {background === 'classroom' && <ClassroomDecorations />}
      {background === 'room' && <RoomDecorations />}
      {background === 'outside' && <OutsideDecorations />}
    </group>
  );
}
