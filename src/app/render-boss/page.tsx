'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useThree } from '@react-three/fiber';
import { useSearchParams } from 'next/navigation';
import BossPreview from '../../components/BossPreview';
import { useGameStore } from '../../store/gameStore';
import { createArchiveItem } from '../../utils/archiveAppearances';

declare global {
  interface Window {
    __BTB_ARCHIVE_ITEM__?: ReturnType<typeof createArchiveItem>;
  }
}

function RenderScene() {
  const params = useSearchParams();
  const setAppearance = useGameStore((s) => s.setAppearance);
  const [ready, setReady] = useState(false);
  const seed = params.get('seed') || 'boss-00001';
  const item = useMemo(() => createArchiveItem(seed), [seed]);

  useEffect(() => {
    // Archive cards already render the name below the thumbnail. Hide the
    // floating 3D name tag so it never gets clipped into the PNG.
    setAppearance({ ...item.appearance, name: '' });
    window.__BTB_ARCHIVE_ITEM__ = item;
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, [item, setAppearance]);

  return (
    <main
      style={{
        width: '512px',
        height: '640px',
        margin: 0,
        overflow: 'hidden',
        background: '#ffc400',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <div
        id="render-card"
        data-ready={ready ? 'true' : 'false'}
        style={{
          width: '512px',
          height: '640px',
          position: 'relative',
          background:
            'radial-gradient(circle at 50% 35%, rgba(255,255,255,0.55), transparent 34%), linear-gradient(180deg, #ffc400, #ffb300)',
        }}
      >
        {/* Camera framing: boss occupies world y ≈ -0.3 (shoe sole) up to ≈ 5.6
            (tall body + tallest hat + hair). Distance 10.4 with fov 32 gives
            ~5.96 units of vertical view, centered on y=2.65 → y ∈ [-0.33, 5.63].
            This trims the empty space around the previous framing while still
            keeping head/hat and feet inside the frame. */}
        <Canvas
          shadows
          camera={{ position: [0, 2.65, 10.4], fov: 32 }}
          gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <CameraAim />
          <ambientLight intensity={0.85} />
          <directionalLight position={[5, 8, 6]} intensity={1.6} castShadow />
          <BossPreview showName={false} />
        </Canvas>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: '84px',
            height: '84px',
            background: '#ffb300',
            zIndex: 5,
          }}
        />
      </div>
    </main>
  );
}

function CameraAim() {
  const { camera } = useThree();
  useEffect(() => {
    camera.lookAt(0, 2.5, 0);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

export default function RenderPage() {
  return (
    <Suspense fallback={null}>
      <RenderScene />
    </Suspense>
  );
}

