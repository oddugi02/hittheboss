'use client';

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import WeaponSelector from './WeaponSelector';
import { ACHIEVEMENT_BY_ID } from '../utils/achievements';
import { submitRun } from '../services/leaderboard';
import { captureGameScreenshot } from '../utils/gameRenderer';

export default function UIOverlay() {
  const stress = useGameStore((s) => s.stress);
  const maxStress = useGameStore((s) => s.maxStress);
  const score = useGameStore((s) => s.score);
  const coins = useGameStore((s) => s.coins);
  const stage = useGameStore((s) => s.stage);
  const combo = useGameStore((s) => s.combo);
  const appearance = useGameStore((s) => s.appearance);
  const background = useGameStore((s) => s.background);
  const setBackground = useGameStore((s) => s.setBackground);
  const speechBubbles = useGameStore((s) => s.speechBubbles);
  const damageLevel = useGameStore((s) => s.damageLevel);
  const bestCombo = useGameStore((s) => s.bestCombo);
  const nextStage = useGameStore((s) => s.nextStage);
  const evaluateAchievements = useGameStore((s) => s.evaluateAchievements);
  const ensureDailyQuests = useGameStore((s) => s.ensureDailyQuests);
  const activeEvent = useGameStore((s) => s.activeEvent);

  const [achievementToasts, setAchievementToasts] = useState<string[]>([]);
  const submittedRunRef = useRef(false);

  const displayName = appearance.name.trim() || 'BOSS';
  const showStageClear = stress <= 0;

  useEffect(() => {
    ensureDailyQuests();
  }, [ensureDailyQuests]);

  useEffect(() => {
    if (!showStageClear) {
      submittedRunRef.current = false;
      return;
    }
    if (submittedRunRef.current) return;
    submittedRunRef.current = true;

    const handle = setTimeout(() => {
      const earned = evaluateAchievements();
      if (earned.length > 0) {
        setAchievementToasts(earned);
        setTimeout(() => setAchievementToasts([]), 4500);
      }
      void submitRun(
        {
          stage,
          damage: score,
          bestCombo,
          durationMs: Math.max(0, Date.now() - useGameStore.getState().runStartedAt),
        },
        displayName,
      );
    }, 0);

    return () => clearTimeout(handle);
  }, [showStageClear, evaluateAchievements, stage, score, bestCombo, displayName]);

  const handleSaveScreenshot = () => {
    // RAF ensures we run AFTER the current React commit and just before the next
    // automatic R3F frame swap, so the WebGL drawing buffer is fresh and stable.
    requestAnimationFrame(() => {
      const dataUrl = captureGameScreenshot();
      if (!dataUrl) return;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const safeName = displayName.replace(/[^\p{L}\p{N}-]+/gu, '_').toLowerCase() || 'boss';
      const fileName = `boss-${safeName}-stage${stage}-damage${score}-${timestamp}.png`;
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  };

  const handleNextStage = () => {
    nextStage();
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10,
        fontFamily: 'var(--font-display)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 32px',
      }}
    >
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* Left: Stress + Stage */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #e53e3e, #9b2c2c)',
                color: '#ffd700', fontSize: '18px', padding: '4px 14px',
                borderRadius: '8px', border: '3px solid #111',
                boxShadow: '3px 3px 0 #000', textShadow: '1px 1px 0 #000',
              }}
            >
              STAGE {stage}
            </div>
            <div
              style={{
                color: '#fff', fontSize: '22px',
                textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                WebkitTextStroke: '2px #000', textTransform: 'uppercase',
              }}
            >
              {displayName}
            </div>
            {activeEvent.modifier !== 'none' && (
              <div style={{
                background: 'linear-gradient(135deg,#9c27b0,#4a148c)',
                color: '#fff', fontSize: '13px', padding: '4px 10px',
                borderRadius: '8px', border: '3px solid #111',
                boxShadow: '3px 3px 0 #000', textShadow: '1px 1px 0 #000',
              }} title={activeEvent.description}>
                ⚡ {activeEvent.label}
              </div>
            )}
          </div>
          <div
            style={{
              width: '300px', height: '36px', background: '#333',
              borderRadius: '18px', border: '4px solid #111',
              boxShadow: '4px 4px 0 #000', overflow: 'hidden', position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute', inset: 0,
                width: `${Math.max(0, (stress / maxStress) * 100)}%`,
                background: stress / maxStress > 0.5
                  ? 'linear-gradient(180deg, #4caf50 0%, #2e7d32 100%)'
                  : stress / maxStress > 0.25
                    ? 'linear-gradient(180deg, #ffd700 0%, #ff8f00 100%)'
                    : 'linear-gradient(180deg, #ff4444 0%, #b71c1c 100%)',
                transition: 'width 0.3s ease-out',
                borderRadius: '14px',
              }}
            />
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '14px', textShadow: '1px 1px 0 #000', WebkitTextStroke: '1px #000',
            }}>
              {Math.round(stress).toLocaleString()} / {maxStress.toLocaleString()}
            </div>
            <div
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '12px',
                background: 'rgba(255,255,255,0.3)', borderRadius: '14px 14px 0 0',
              }}
            />
          </div>

          {/* Damage level indicator */}
          <div style={{ marginTop: '6px', display: 'flex', gap: '4px' }}>
            {[0, 1, 2, 3, 4].map((lvl) => (
              <div key={lvl} style={{
                width: '20px', height: '6px', borderRadius: '3px',
                background: damageLevel >= lvl ? ['#4caf50', '#8bc34a', '#ffc107', '#ff9800', '#f44336'][lvl] : '#444',
                border: '1px solid #111',
              }} />
            ))}
          </div>
        </div>

        {/* Right: Score + Coins + Combo. marginTop carves out room for the
            SoundToggle in the top-right corner without re-flowing this stack. */}
        <div style={{ textAlign: 'right', marginTop: '54px' }}>
          <div style={{
            color: '#fff', fontSize: '18px',
            textShadow: '3px 3px 0 #000, -1px -1px 0 #000',
            WebkitTextStroke: '1.5px #000',
          }}>
            DAMAGE
          </div>
          <div style={{
            fontSize: '48px', color: '#ffd700', lineHeight: 1,
            textShadow: '4px 4px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
            WebkitTextStroke: '3px #000',
          }}>
            {score.toLocaleString()}
          </div>

          {/* Coins */}
          <div style={{
            fontSize: '22px', color: '#ffd700', marginTop: '8px',
            textShadow: '2px 2px 0 #000', WebkitTextStroke: '1px #000',
          }}>
            🪙 {coins.toLocaleString()}
          </div>

          <button
            onClick={handleSaveScreenshot}
            style={{
              marginTop: '10px',
              pointerEvents: 'auto',
              background: 'linear-gradient(180deg, #2196f3, #1565c0)',
              color: '#fff',
              border: '3px solid #111',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '18px',
              cursor: 'pointer',
              boxShadow: '3px 3px 0 #000',
              textShadow: '1px 1px 0 #000',
              fontFamily: 'inherit',
            }}
            title="현재 게임 화면을 PNG로 저장"
          >
            📸 SAVE PNG
          </button>

          {/* Combo */}
          {combo > 1 && (
            <div style={{
              fontSize: '28px', marginTop: '8px',
              color: combo > 10 ? '#ff4444' : combo > 5 ? '#ff8800' : '#ffd700',
              textShadow: '3px 3px 0 #000', WebkitTextStroke: '2px #000',
              animation: 'pulse 0.3s ease-in-out',
            }}>
              {combo}x COMBO!
            </div>
          )}
        </div>
      </div>

      {/* Achievement toasts */}
      {achievementToasts.length > 0 && (
        <div style={{
          position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', gap: '8px',
          pointerEvents: 'none',
        }}>
          {achievementToasts.map((id) => {
            const a = ACHIEVEMENT_BY_ID[id];
            if (!a) return null;
            return (
              <div key={id} style={{
                background: 'linear-gradient(135deg,#ffb300,#e65100)',
                color: '#fff', padding: '10px 18px', borderRadius: '12px',
                border: '3px solid #111', boxShadow: '4px 4px 0 #000',
                fontSize: '18px', textShadow: '1px 1px 0 #000',
              }}>
                🏆 {a.title} <span style={{ fontSize: '13px', opacity: 0.85 }}>+{a.reward} 🪙</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Speech Bubbles */}
      {speechBubbles.length > 0 && (
        <div style={{
          position: 'absolute', top: '35%', left: '50%', transform: 'translateX(-50%)',
          pointerEvents: 'none',
        }}>
          {speechBubbles.map((sb) => (
            <div key={sb.id} style={{
              background: '#fff', color: '#333', fontSize: '22px',
              padding: '10px 20px', borderRadius: '20px',
              border: '3px solid #111', boxShadow: '3px 3px 0 #000',
              fontFamily: 'system-ui, sans-serif', fontWeight: 'bold',
              animation: 'floatUp 2s ease-out forwards',
              marginBottom: '8px', whiteSpace: 'nowrap',
            }}>
              {sb.text}
            </div>
          ))}
        </div>
      )}

      {/* Bottom area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: '24px' }}>
        {/* Weapon selector */}
        <div style={{ pointerEvents: 'auto', maxWidth: '420px' }}>
          <WeaponSelector />
        </div>

        {/* Center Hint */}
        <div
          style={{
            position: 'absolute', left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(180deg, #e53e3e 0%, #9b2c2c 100%)',
            border: '4px solid #111', color: '#ffd700', fontSize: '36px',
            padding: '12px 40px', borderRadius: '16px',
            boxShadow: '5px 5px 0 #000',
            textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
            WebkitTextStroke: '2px #000', textAlign: 'center',
            animation: 'bounce 2s infinite',
          }}
        >
          CLICK TO THROW!
        </div>
        
        <div style={{ width: '200px' }} />
      </div>

      {/* Screen-edge Background Arrows */}
      {(() => {
        const bgList = [
          { key: 'office' as const, label: '🏢 사무실' },
          { key: 'classroom' as const, label: '🏫 교실' },
          { key: 'room' as const, label: '🏠 방' },
          { key: 'outside' as const, label: '🌳 밖' },
        ];
        const idx = bgList.findIndex((b) => b.key === background);
        const prev = () => setBackground(bgList[(idx - 1 + bgList.length) % bgList.length].key);
        const next = () => setBackground(bgList[(idx + 1) % bgList.length].key);
        const arrowStyle: React.CSSProperties = {
          position: 'absolute', top: '50%', transform: 'translateY(-50%)',
          pointerEvents: 'auto', background: 'rgba(0,0,0,0.5)',
          color: '#fff', border: '4px solid #111', borderRadius: '16px',
          padding: '20px 14px', fontSize: '36px', fontFamily: 'inherit',
          cursor: 'pointer', boxShadow: '4px 4px 0 #000',
          textShadow: '2px 2px 0 #000', lineHeight: 1,
          backdropFilter: 'blur(4px)', transition: 'all 0.15s ease',
        };
        return (
          <>
            <button onClick={prev} style={{ ...arrowStyle, left: '12px' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,152,0,0.8)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; }}
            >◀</button>
            <button onClick={next} style={{ ...arrowStyle, right: '12px' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,152,0,0.8)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; }}
            >▶</button>
          </>
        );
      })()}

      {/* Stage Clear Overlay */}
      {showStageClear && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'auto', zIndex: 100,
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{
            fontSize: '72px', color: '#ffd700',
            textShadow: '5px 5px 0 #000, -2px -2px 0 #000',
            WebkitTextStroke: '3px #000',
            animation: 'bounce 1s ease-in-out',
          }}>
            🎉 STAGE {stage} CLEAR! 🎉
          </div>
          <div style={{
            fontSize: '32px', color: '#fff', marginTop: '16px',
            textShadow: '3px 3px 0 #000', WebkitTextStroke: '2px #000',
          }}>
            TOTAL DAMAGE: {score.toLocaleString()}
          </div>
          <div style={{
            fontSize: '28px', color: '#ffd700', marginTop: '8px',
            textShadow: '2px 2px 0 #000',
          }}>
            🪙 COINS: {coins.toLocaleString()} | BEST COMBO: {bestCombo}x
          </div>
          <button
            onClick={handleNextStage}
            style={{
              marginTop: '32px', padding: '16px 48px', fontSize: '36px',
              background: 'linear-gradient(180deg, #4caf50 0%, #2e7d32 100%)',
              color: '#fff', border: '5px solid #111', borderRadius: '16px',
              cursor: 'pointer', boxShadow: '5px 5px 0 #000',
              textShadow: '2px 2px 0 #000', WebkitTextStroke: '2px #000',
              fontFamily: 'inherit',
            }}
          >
            NEXT STAGE ▶
          </button>
        </div>
      )}

      <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-60px); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}
