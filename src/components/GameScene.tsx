'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { Suspense, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { gameRenderer } from '../utils/gameRenderer';
import Room from './Room';
import Boss from './Boss';
import WeaponSystem from './WeaponSystem';
import VFX from './VFX';
import DestructibleProps from './DestructibleProps';

const clearColors: Record<string, string> = {
  office: '#e8dcc8',
  classroom: '#c8d8b8',
  room: '#e8d0e0',
  outside: '#87ceeb',
};

function ClearColorUpdater() {
  const { gl } = useThree();
  const background = useGameStore((s) => s.background);
  
  useEffect(() => {
    gl.setClearColor(clearColors[background] || '#e8dcc8');
  }, [background, gl]);
  
  return null;
}

function RendererBridge() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    gameRenderer.gl = gl;
    gameRenderer.scene = scene;
    gameRenderer.camera = camera;
    return () => {
      if (gameRenderer.gl === gl) {
        gameRenderer.gl = undefined;
        gameRenderer.scene = undefined;
        gameRenderer.camera = undefined;
      }
    };
  }, [gl, scene, camera]);
  return null;
}

function LoadingScreen() {
  return (
    <mesh position={[0, 3, 0]}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#aaa" />
    </mesh>
  );
}

function SceneControls() {
  const isDragging = useGameStore((s) => s.isDragging);

  return (
    <OrbitControls
      enabled={!isDragging}
      target={[0, 3.5, 0]}
      enableZoom={false}
      enablePan={false}
      maxPolarAngle={Math.PI / 2}
      minPolarAngle={Math.PI / 6}
      minAzimuthAngle={-Math.PI / 4}
      maxAzimuthAngle={Math.PI / 4}
    />
  );
}

export default function GameScene() {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      <Canvas
        shadows
        gl={{ antialias: true, alpha: false, powerPreference: 'default', preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          gl.setClearColor('#e8dcc8');
          gl.domElement.id = 'game-canvas';
        }}
      >
        <ClearColorUpdater />
        <RendererBridge />
        <PerspectiveCamera makeDefault position={[0, 5, 10]} fov={50} />
        <SceneControls />

        {/* Lighting */}
        <ambientLight intensity={0.8} color="#ffeedd" />
        <directionalLight
          castShadow
          position={[5, 12, 8]}
          intensity={2.0}
          color="#ffffff"
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-2}
          shadow-bias={-0.001}
        />
        <directionalLight position={[-4, 8, -4]} intensity={0.6} color="#aaccff" />
        <hemisphereLight args={['#ffeeb1', '#080820', 0.5]} />

        <Suspense fallback={<LoadingScreen />}>
          <Physics gravity={[0, -15, 0]}>
            <Room />
            <Boss key={`${useGameStore((s) => s.appearance.gender)}-${useGameStore((s) => s.appearance.hairStyle)}-${useGameStore((s) => s.appearance.tieStyle)}-${useGameStore((s) => s.appearance.glassesStyle)}-${useGameStore((s) => s.appearance.facialHair)}`} />
            <DestructibleProps />
            <WeaponSystem />
            <VFX />
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  );
}
