'use client';

import dynamic from 'next/dynamic';
import UIOverlay from '../components/UIOverlay';
import CustomizationMenu from '../components/CustomizationMenu';
import BGMPlayer from '../components/BGMPlayer';
import ShopPanel from '../components/ShopPanel';
import MetaPanel from '../components/MetaPanel';
import CloudSync from '../components/CloudSync';
import ScreenEffects from '../components/ScreenEffects';
import SoundToggle from '../components/SoundToggle';
import ScreenShakeWrap from '../components/ScreenShakeWrap';

const GameScene = dynamic(() => import('../components/GameScene'), { ssr: false });

export default function Home() {
  return (
    <main style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#e8dcc8' }}>
      {/* The 3D scene + overlays that should shake together when combos /
          crits trigger screen shake. UIOverlay is intentionally outside so
          the HUD stays readable while the world shakes. */}
      <ScreenShakeWrap>
        <GameScene />
      </ScreenShakeWrap>
      <UIOverlay />
      <CustomizationMenu />
      <ShopPanel />
      <MetaPanel />
      <SoundToggle />
      <ScreenEffects />
      <BGMPlayer />
      <CloudSync />
    </main>
  );
}
