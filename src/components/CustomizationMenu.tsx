'use client';

import { useState, useCallback, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type * as THREE from 'three';
import BossPreview from './BossPreview';
import { encodeAppearance, decodeAppearance } from '../utils/shareCode';

type Tab = 'body' | 'face' | 'hair' | 'outfit' | 'data';

/**
 * Boss customization panel. The number of options has grown enough that we
 * now organize controls into 5 tabs:
 *
 *   • body   — gender, body type, height, skin color
 *   • face   — eyes/eyebrows/mouth/nose/glasses/face accessory/blush
 *   • hair   — hair style+color, hat, facial hair
 *   • outfit — outfit kind, shirt/tie/pants/shoes colors
 *   • data   — name, presets, share code, screenshot
 *
 * Tabs let us keep each panel scannable without piling everything into one
 * giant scrolling column.
 */
export default function CustomizationMenu() {
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('body');
  const [presetName, setPresetName] = useState('');
  const [shareInput, setShareInput] = useState('');
  const [shareStatus, setShareStatus] = useState<{ msg: string; tone: 'ok' | 'error' } | null>(null);
  const appearance = useGameStore((s) => s.appearance);
  const updateAppearance = useGameStore((s) => s.updateAppearance);
  const setAppearance = useGameStore((s) => s.setAppearance);
  const savedPresets = useGameStore((s) => s.savedPresets);
  const savePreset = useGameStore((s) => s.savePreset);
  const loadPreset = useGameStore((s) => s.loadPreset);
  const deletePreset = useGameStore((s) => s.deletePreset);
  const randomizeAppearance = useGameStore((s) => s.randomizeAppearance);
  const resetAppearance = useGameStore((s) => s.resetAppearance);

  const handleResetAppearance = useCallback(() => {
    if (typeof window === 'undefined' || window.confirm('외형을 기본값으로 되돌리시겠습니까?\n(이름은 유지됩니다)')) {
      resetAppearance();
      setShareStatus({ msg: '기본 외형으로 되돌렸습니다 ✓', tone: 'ok' });
      setTimeout(() => setShareStatus(null), 2500);
    }
  }, [resetAppearance]);

  const exportShareCode = useCallback(async () => {
    const code = encodeAppearance(appearance);
    if (!code) {
      setShareStatus({ msg: '코드 생성에 실패했습니다.', tone: 'error' });
      setTimeout(() => setShareStatus(null), 3000);
      return;
    }
    setShareInput(code);
    try {
      await navigator.clipboard.writeText(code);
      setShareStatus({ msg: '클립보드에 복사되었습니다 ✓', tone: 'ok' });
    } catch {
      setShareStatus({ msg: '코드가 생성되었습니다. 입력란에서 복사하세요.', tone: 'ok' });
    }
    setTimeout(() => setShareStatus(null), 3000);
  }, [appearance]);

  const importShareCode = useCallback(() => {
    if (!shareInput.trim()) {
      setShareStatus({ msg: '먼저 코드를 붙여넣어 주세요.', tone: 'error' });
      setTimeout(() => setShareStatus(null), 3000);
      return;
    }
    const decoded = decodeAppearance(shareInput);
    if (!decoded) {
      setShareStatus({ msg: '잘못된 코드입니다. 전체를 제대로 복사했는지 확인하세요.', tone: 'error' });
      setTimeout(() => setShareStatus(null), 4000);
      return;
    }
    setAppearance(decoded);
    setShareStatus({ msg: '외형을 불러왔습니다 ✓', tone: 'ok' });
    setTimeout(() => setShareStatus(null), 3000);
  }, [shareInput, setAppearance]);

  const takeScreenshot = useCallback(() => {
    requestAnimationFrame(() => {
      const gl = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      const canvas = previewCanvasRef.current;
      if (!gl || !scene || !camera || !canvas) return;

      gl.render(scene, camera);
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `boss_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  }, []);

  // ── Color palettes (mirrors the randomizer pool in gameStore) ──
  const colors = {
    skin: ['#ffcdb2', '#ffbfa3', '#f1c27d', '#e0ac69', '#e2a37f', '#c98a6c', '#c68642', '#a05a2c', '#8d5524', '#5c3317', '#a8e6cf', '#d4c5f9', '#ffd6a5'],
    hair: ['#3e2723', '#111111', '#5c3a21', '#9e5a1b', '#d4af37', '#e2e2e2', '#bf4f51', '#4a154b', '#ff5722', '#ff4081', '#651fff', '#00bcd4', '#76ff03'],
    eye: ['#111111', '#2196f3', '#4caf50', '#795548', '#9c27b0', '#f44336', '#ffd700', '#ff5722', '#00e5ff'],
    clothes: ['#3d5af1', '#f44336', '#4caf50', '#ff9800', '#9c27b0', '#212121', '#ffffff', '#e91e63', '#00bcd4', '#ffeb3b', '#3f51b5', '#8bc34a'],
    pants: ['#2d3a8c', '#1a1a1a', '#5d4037', '#607d8b', '#3e2723', '#009688', '#f44336', '#ffeb3b', '#37474f', '#4a148c'],
    shoes: ['#5c3317', '#111111', '#ffffff', '#795548', '#f44336', '#2196f3', '#ffd700', '#1a237e'],
    hat: ['#f44336', '#1976d2', '#212121', '#ffd700', '#4caf50', '#ff9800', '#9c27b0', '#ffffff', '#e91e63', '#00bcd4'],
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'absolute', bottom: '24px', right: '24px', zIndex: 50,
          minWidth: '280px',
          background: '#4caf50', color: 'white', border: '4px solid #111',
          padding: '12px 24px', borderRadius: '12px', fontSize: '24px',
          fontFamily: 'var(--font-display)',
          cursor: 'pointer', boxShadow: '4px 4px 0 #000',
          textShadow: '2px 2px 0 #000', WebkitTextStroke: '1px #000',
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >CUSTOMIZE BOSS</button>
    );
  }

  // ── Reusable inline helpers ────────────────────────────────────────────
  const renderColorOptions = (label: string, field: keyof typeof appearance, options: string[]) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '16px', marginBottom: '6px', color: '#fff', textShadow: '1px 1px 0 #000' }}>{label}</div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {options.map((color) => (
          <button key={color} onClick={() => updateAppearance({ [field]: color })} style={{
            width: '28px', height: '28px', background: color,
            border: appearance[field] === color ? '3px solid #fff' : '2px solid #111',
            borderRadius: '50%', cursor: 'pointer', boxShadow: '2px 2px 0 #000',
            transform: appearance[field] === color ? 'scale(1.15)' : 'scale(1)',
          }} />
        ))}
      </div>
    </div>
  );

  const btnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '8px 6px', background: active ? '#4caf50' : '#555',
    color: 'white', border: '3px solid #111', borderRadius: '8px', cursor: 'pointer',
    fontSize: '14px', textTransform: 'uppercase', boxShadow: '3px 3px 0 #000',
    textShadow: '1px 1px 0 #000', fontFamily: 'inherit',
  });

  const renderEnumOptions = <T extends string>(
    label: string,
    field: keyof typeof appearance,
    options: readonly T[],
  ) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '16px', marginBottom: '6px', color: '#fff', textShadow: '1px 1px 0 #000' }}>{label}</div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => updateAppearance({ [field]: opt })}
            style={{
              ...btnStyle(appearance[field] === opt),
              flex: '0 1 auto',
              minWidth: '60px',
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  const tabBtn = (tab: Tab): React.CSSProperties => ({
    flex: 1,
    padding: '6px',
    background: activeTab === tab ? '#ffd700' : '#444',
    color: activeTab === tab ? '#111' : '#fff',
    border: '3px solid #111',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxShadow: activeTab === tab ? '3px 3px 0 #000' : '2px 2px 0 #000',
    textShadow: activeTab === tab ? 'none' : '1px 1px 0 #000',
    textTransform: 'uppercase',
  });

  return (
    <div
      style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        zIndex: 50, background: 'rgba(30, 30, 40, 0.95)',
        border: '6px solid #111', borderRadius: '24px', padding: '32px',
        width: '880px', display: 'flex', gap: '32px', maxHeight: '90vh',
        fontFamily: 'var(--font-display)',
        boxShadow: '8px 8px 0 rgba(0,0,0,0.5)',
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Left: 3D Preview */}
      <div style={{ flex: 1, background: '#444', borderRadius: '16px', border: '4px solid #111', overflow: 'hidden', position: 'relative' }}>
        <Canvas
          shadows
          camera={{ position: [0, 2, 6], fov: 50 }}
          gl={{ preserveDrawingBuffer: true, antialias: true }}
          onCreated={({ gl, scene, camera }) => {
            previewCanvasRef.current = gl.domElement;
            rendererRef.current = gl;
            sceneRef.current = scene;
            cameraRef.current = camera;
          }}
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
          <BossPreview />
          <OrbitControls target={[0, 1.5, 0]} enablePan={false} minDistance={3} maxDistance={10} />
        </Canvas>
        <div style={{ position: 'absolute', bottom: '16px', left: 0, right: 0, textAlign: 'center', color: '#fff', opacity: 0.5 }}>
          Drag to rotate preview
        </div>
      </div>

      {/* Right: Controls */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ color: '#ffd700', fontSize: '28px', margin: 0, textShadow: '2px 2px 0 #000', WebkitTextStroke: '1px #000' }}>CUSTOMIZE</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={randomizeAppearance}
              title="모든 외형 옵션을 랜덤으로 섞기 (이름은 유지)"
              style={{
                background: 'linear-gradient(180deg,#ff9800,#e65100)',
                color: 'white', border: '4px solid #111', borderRadius: '12px',
                padding: '0 14px', height: '40px', fontSize: '14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '4px', boxShadow: '2px 2px 0 #000',
                fontFamily: 'inherit', textShadow: '1px 1px 0 #000',
                whiteSpace: 'nowrap',
              }}
            >
              🎲 SURPRISE ME!
            </button>
            <button
              onClick={handleResetAppearance}
              title="외형을 기본값으로 되돌리기 (이름은 유지)"
              style={{
                background: 'linear-gradient(180deg,#9e9e9e,#424242)',
                color: 'white', border: '4px solid #111', borderRadius: '12px',
                padding: '0 14px', height: '40px', fontSize: '14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '4px', boxShadow: '2px 2px 0 #000',
                fontFamily: 'inherit', textShadow: '1px 1px 0 #000',
                whiteSpace: 'nowrap',
              }}
            >
              ↺ RESET
            </button>
            <button onClick={takeScreenshot} style={{
              background: '#2196f3', color: 'white', border: '4px solid #111', borderRadius: '50%',
              width: '40px', height: '40px', fontSize: '18px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 2px 0 #000',
            }}>📷</button>
            <button onClick={() => setIsOpen(false)} style={{
              background: '#f44336', color: 'white', border: '4px solid #111', borderRadius: '50%',
              width: '40px', height: '40px', fontSize: '20px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 2px 0 #000',
            }}>✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
          <button onClick={() => setActiveTab('body')} style={tabBtn('body')}>🧍 Body</button>
          <button onClick={() => setActiveTab('face')} style={tabBtn('face')}>😀 Face</button>
          <button onClick={() => setActiveTab('hair')} style={tabBtn('hair')}>💇 Hair</button>
          <button onClick={() => setActiveTab('outfit')} style={tabBtn('outfit')}>👔 Outfit</button>
          <button onClick={() => setActiveTab('data')} style={tabBtn('data')}>💾 Data</button>
        </div>

        {/* Tab content (scrollable) */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '12px', minHeight: 0 }}>
          {activeTab === 'body' && (
            <>
              {renderEnumOptions('Gender', 'gender', ['male', 'female'] as const)}
              {renderEnumOptions('Body Type', 'bodyType', ['slim', 'average', 'bulky'] as const)}
              {renderEnumOptions('Height', 'height', ['short', 'average', 'tall'] as const)}
              {renderColorOptions('Skin Color', 'skinColor', colors.skin)}
            </>
          )}

          {activeTab === 'face' && (
            <>
              {renderColorOptions('Eye Color', 'eyeColor', colors.eye)}
              {renderEnumOptions('Eyebrows', 'eyebrowStyle', ['normal', 'bushy', 'thin', 'unibrow'] as const)}
              {renderEnumOptions('Mouth', 'mouthStyle', ['neutral', 'smile', 'smirk', 'grin', 'frown'] as const)}
              {renderEnumOptions('Nose', 'noseStyle', ['small', 'normal', 'big', 'pointy'] as const)}
              {renderEnumOptions('Glasses', 'glassesStyle', ['none', 'glasses', 'sunglasses'] as const)}
              {renderEnumOptions('Face Accessory', 'faceAccessory', ['none', 'eyepatch', 'scar', 'mole', 'mask', 'bandage'] as const)}
            </>
          )}

          {activeTab === 'hair' && (
            <>
              {renderEnumOptions('Hair Style', 'hairStyle', ['short', 'long', 'bald', 'spiky', 'mohawk', 'bob', 'bun', 'pigtails'] as const)}
              {renderColorOptions('Hair Color', 'hairColor', colors.hair)}
              {renderEnumOptions('Facial Hair', 'facialHair', ['none', 'mustache', 'beard', 'goatee', 'stubble'] as const)}
              {renderEnumOptions('Hat', 'hat', ['none', 'cap', 'crown', 'tophat', 'partyhat', 'beanie', 'horns', 'halo'] as const)}
              {appearance.hat !== 'none' && appearance.hat !== 'crown' && appearance.hat !== 'horns' && appearance.hat !== 'halo' && (
                renderColorOptions('Hat Color', 'hatColor', colors.hat)
              )}
            </>
          )}

          {activeTab === 'outfit' && (
            <>
              {renderEnumOptions('Outfit Style', 'outfit', ['suit', 'casual', 'tracksuit', 'hoodie', 'royal'] as const)}
              {renderColorOptions('Shirt Color', 'shirtColor', colors.clothes)}
              {appearance.outfit === 'suit' && (
                <>
                  {renderEnumOptions('Tie Style', 'tieStyle', ['none', 'long', 'bowtie'] as const)}
                  {renderColorOptions('Tie Color', 'tieColor', colors.clothes)}
                </>
              )}
              {renderColorOptions('Pants Color', 'pantsColor', colors.pants)}
              {renderColorOptions('Shoes Color', 'shoeColor', colors.shoes)}
            </>
          )}

          {activeTab === 'data' && (
            <>
              {/* Name */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '16px', marginBottom: '6px', color: '#fff', textShadow: '1px 1px 0 #000' }}>Name</div>
                <input value={appearance.name} onChange={(e) => updateAppearance({ name: e.target.value })} maxLength={12}
                  style={{ width: '100%', padding: '8px 12px', background: '#555', color: '#fff', border: '3px solid #111', borderRadius: '8px', fontSize: '20px', fontFamily: 'inherit', boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.3)' }} />
              </div>

              {/* Presets */}
              <div style={{ borderTop: '3px solid #555', paddingTop: '12px' }}>
                <div style={{ fontSize: '20px', marginBottom: '4px', color: '#ffd700', textShadow: '2px 2px 0 #000' }}>💾 PRESETS</div>
                <div style={{ fontSize: '12px', color: '#bbb', marginBottom: '8px', lineHeight: 1.4 }}>
                  현재 보스 외형 전체를 이름과 함께 이 브라우저에 저장합니다. 클릭하면 그 외형을 즉시
                  불러오고, ✕ 버튼으로 삭제할 수 있습니다. 최대 <b>10개</b>까지 보관되며 가득 차면
                  가장 오래된 프리셋이 자동 삭제됩니다.
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="Preset name..."
                    maxLength={12} style={{ flex: 1, padding: '8px 12px', background: '#555', color: '#fff', border: '3px solid #111', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit' }} />
                  <button onClick={() => { if (presetName.trim()) { savePreset(presetName.trim()); setPresetName(''); } }} style={{
                    background: '#4caf50', color: '#fff', border: '3px solid #111', borderRadius: '8px',
                    padding: '8px 16px', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '2px 2px 0 #000',
                  }}>SAVE</button>
                </div>
                {savedPresets.length === 0 ? (
                  <div style={{ color: '#888', fontSize: '13px' }}>No saved presets yet</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {savedPresets.map((p, i) => (
                      <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button onClick={() => loadPreset(i)} style={{
                          flex: 1, background: '#555', color: '#fff', border: '2px solid #111', borderRadius: '8px',
                          padding: '6px 12px', fontSize: '14px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                        }}>{p.name}</button>
                        <button onClick={() => deletePreset(i)} style={{
                          background: '#f44336', color: '#fff', border: '2px solid #111', borderRadius: '6px',
                          padding: '4px 10px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
                        }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Share Code */}
              <div style={{ marginTop: '16px', borderTop: '3px solid #555', paddingTop: '12px' }}>
                <div style={{ fontSize: '20px', marginBottom: '4px', color: '#ffd700', textShadow: '2px 2px 0 #000' }}>🔗 SHARE CODE</div>
                <div style={{ fontSize: '12px', color: '#bbb', marginBottom: '8px', lineHeight: 1.4 }}>
                  보스 외형을 한 줄짜리 텍스트 코드로 변환해 친구와 주고받는 기능입니다.
                  <b style={{ color: '#9ee493' }}> EXPORT</b>로 내 보스 코드를 클립보드에 복사하고,
                  받은 코드를 입력란에 붙여넣고 <b style={{ color: '#9ee493' }}>IMPORT</b>를 누르면
                  그 외형이 즉시 적용됩니다.
                </div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                  <input
                    value={shareInput}
                    onChange={(e) => setShareInput(e.target.value)}
                    placeholder="Paste code here..."
                    style={{
                      flex: 1, padding: '8px 12px', background: '#555', color: '#fff',
                      border: '3px solid #111', borderRadius: '8px', fontSize: '12px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <button onClick={importShareCode} style={{
                    background: '#4caf50', color: '#fff', border: '3px solid #111', borderRadius: '8px',
                    padding: '8px 16px', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '2px 2px 0 #000',
                  }}>IMPORT</button>
                </div>
                <button onClick={exportShareCode} style={{
                  width: '100%', background: 'linear-gradient(180deg,#2196f3,#1565c0)',
                  color: '#fff', border: '3px solid #111', borderRadius: '8px',
                  padding: '8px', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '3px 3px 0 #000',
                }}>EXPORT MY BOSS CODE</button>
                {shareStatus && (
                  <div style={{
                    marginTop: '6px', fontSize: '12px',
                    color: shareStatus.tone === 'ok' ? '#9ee493' : '#ff7e7e',
                  }}>{shareStatus.msg}</div>
                )}
              </div>

              {/* Screenshot */}
              <button onClick={takeScreenshot} style={{
                marginTop: '16px', width: '100%', padding: '12px',
                background: 'linear-gradient(180deg, #2196f3, #1565c0)',
                color: '#fff', border: '3px solid #111', borderRadius: '10px',
                fontSize: '18px', cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '3px 3px 0 #000', textShadow: '1px 1px 0 #000',
              }}>📷 SCREENSHOT</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
