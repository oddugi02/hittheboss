'use client';

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  playCriticalSound,
  playComboMilestoneSound,
  setMasterVolume,
  setMuted,
} from '../utils/sounds';

const COMBO_LABELS: Record<number, { text: string; subtitle: string; color: string; glow: string }> = {
  10: { text: 'FIRE!', subtitle: '10x COMBO', color: '#ff8800', glow: '#ffae00' },
  25: { text: 'BLAZING!', subtitle: '25x COMBO', color: '#ff3d00', glow: '#ff6d00' },
  50: { text: 'INFERNO!', subtitle: '50x COMBO', color: '#ff1744', glow: '#ff5252' },
  100: { text: 'GOD-LIKE!', subtitle: '100x COMBO', color: '#ffd700', glow: '#fff176' },
};

interface MilestoneFlash {
  id: number;
  value: number;
}

/**
 * Mounts once at the root of the game UI. Handles three pieces of feedback:
 *
 * 1. Critical hit sound (the actual visual is now a red emissive flash on the
 *    boss meshes, handled inside Boss.tsx — no on-screen text here).
 * 2. Combo milestone visual + SFX (subscribes to `comboMilestone`). The
 *    visual is intentionally aggressive: full-screen radial flash, beefy
 *    text with shake, edge vignette pulse.
 * 3. Master sound volume / mute hookup (subscribes to `soundMuted`/`soundVolume`).
 */
export default function ScreenEffects() {
  const lastCritAt = useGameStore((s) => s.lastCritAt);
  const comboMilestone = useGameStore((s) => s.comboMilestone);
  const consumeComboMilestone = useGameStore((s) => s.consumeComboMilestone);
  const soundMuted = useGameStore((s) => s.soundMuted);
  const soundVolume = useGameStore((s) => s.soundVolume);

  const [milestones, setMilestones] = useState<MilestoneFlash[]>([]);
  const idRef = useRef(0);
  const lastSeenCritRef = useRef(0);
  const lastSeenMilestoneAtRef = useRef(0);

  // Sync sound settings to the audio module.
  useEffect(() => { setMuted(soundMuted); }, [soundMuted]);
  useEffect(() => { setMasterVolume(soundVolume); }, [soundVolume]);

  // Crit sound only — the visual is rendered by Boss directly.
  useEffect(() => {
    if (!lastCritAt || lastCritAt === lastSeenCritRef.current) return;
    lastSeenCritRef.current = lastCritAt;
    playCriticalSound();
  }, [lastCritAt]);

  // Combo milestones.
  useEffect(() => {
    if (!comboMilestone || comboMilestone.at === lastSeenMilestoneAtRef.current) return;
    lastSeenMilestoneAtRef.current = comboMilestone.at;
    playComboMilestoneSound(comboMilestone.value);
    const id = ++idRef.current;
    setMilestones((prev) => [...prev, { id, value: comboMilestone.value }]);
    const clearMs = comboMilestone.value >= 100 ? 1900 : comboMilestone.value >= 50 ? 1500 : 1200;
    const handle = setTimeout(() => {
      setMilestones((prev) => prev.filter((m) => m.id !== id));
      consumeComboMilestone();
    }, clearMs);
    return () => clearTimeout(handle);
  }, [comboMilestone, consumeComboMilestone]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 80,
      }}
    >
      {milestones.map((m) => {
        const cfg = COMBO_LABELS[m.value] ?? COMBO_LABELS[10];
        const tier = m.value >= 100 ? 'godlike' : m.value >= 50 ? 'inferno' : m.value >= 25 ? 'blazing' : 'fire';
        const big = m.value >= 50;
        const huge = m.value >= 100;

        return (
          <div key={m.id}>
            {/* Full-screen radial color burst */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(circle at 50% 50%, ${cfg.glow}80 0%, ${cfg.color}40 30%, transparent 65%)`,
                mixBlendMode: 'screen',
                animation: `burst-${tier} ${huge ? 0.9 : 0.7}s ease-out forwards`,
              }}
            />
            {/* Edge vignette pulse — bright frame around the playfield */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                boxShadow: `inset 0 0 ${huge ? 220 : big ? 160 : 120}px ${huge ? 90 : 70}px ${cfg.color}cc`,
                animation: `vignette-${tier} ${huge ? 1.4 : 1.1}s ease-out forwards`,
              }}
            />
            {/* Streak lines flying inward */}
            {big && Array.from({ length: huge ? 12 : 8 }).map((_, i) => {
              const angle = (360 / (huge ? 12 : 8)) * i + (huge ? 0 : 22.5);
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '8px',
                    height: '60vmax',
                    background: `linear-gradient(0deg, transparent 0%, ${cfg.glow} 35%, #fff 100%)`,
                    transform: `translate(-50%, -100%) rotate(${angle}deg)`,
                    transformOrigin: 'bottom center',
                    opacity: 0,
                    animation: `streak-${tier} ${huge ? 1.3 : 1.0}s ease-out forwards`,
                    animationDelay: `${i * 30}ms`,
                  }}
                />
              );
            })}
            {/* Text */}
            <div
              style={{
                position: 'absolute',
                top: '45%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                fontFamily: 'var(--font-display)',
                animation: `milestone-pop-${tier} ${huge ? 1.7 : big ? 1.4 : 1.1}s cubic-bezier(0.2, 1.6, 0.3, 1) forwards`,
              }}
            >
              <div
                style={{
                  color: cfg.color,
                  fontSize: huge ? '160px' : big ? '128px' : '92px',
                  fontWeight: 900,
                  letterSpacing: '8px',
                  lineHeight: 1,
                  textShadow: `0 0 40px ${cfg.glow}, 0 0 80px ${cfg.glow}, 7px 7px 0 #111, -4px -4px 0 #111, 4px -4px 0 #111, -4px 4px 0 #111`,
                  WebkitTextStroke: '5px #111',
                  filter: huge ? 'drop-shadow(0 0 30px #fff)' : undefined,
                }}
              >
                {cfg.text}
              </div>
              <div
                style={{
                  marginTop: '12px',
                  color: '#fff',
                  fontSize: huge ? '40px' : big ? '32px' : '26px',
                  textShadow: `0 0 18px ${cfg.glow}, 3px 3px 0 #000`,
                  WebkitTextStroke: '2px #000',
                  letterSpacing: '4px',
                }}
              >
                {cfg.subtitle}
              </div>
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes milestone-pop-fire {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
          15% { opacity: 1; transform: translate(-50%, -50%) scale(1.35) rotate(-3deg); }
          30% { transform: translate(-50%, -50%) scale(1.05) rotate(2deg); }
          45% { transform: translate(-50%, -50%) scale(1.10) rotate(-1deg); }
          85% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
          100% { opacity: 0; transform: translate(-50%, -75%) scale(1.1); }
        }
        @keyframes milestone-pop-blazing {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.25); }
          12% { opacity: 1; transform: translate(-50%, -50%) scale(1.5) rotate(-5deg); }
          25% { transform: translate(-50%, -50%) scale(1.1) rotate(4deg); }
          40% { transform: translate(-50%, -50%) scale(1.18) rotate(-2deg); }
          85% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
          100% { opacity: 0; transform: translate(-50%, -85%) scale(1.15); }
        }
        @keyframes milestone-pop-inferno {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.2) rotate(-12deg); }
          10% { opacity: 1; transform: translate(-50%, -50%) scale(1.7) rotate(6deg); }
          22% { transform: translate(-50%, -50%) scale(1.15) rotate(-4deg); }
          35% { transform: translate(-50%, -50%) scale(1.25) rotate(2deg); }
          50% { transform: translate(-50%, -50%) scale(1.20); }
          85% { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }
          100% { opacity: 0; transform: translate(-50%, -100%) scale(1.2); }
        }
        @keyframes milestone-pop-godlike {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.1) rotate(-25deg); filter: hue-rotate(0deg) brightness(2); }
          8% { opacity: 1; transform: translate(-50%, -50%) scale(2.0) rotate(10deg); filter: hue-rotate(20deg) brightness(2.5); }
          20% { transform: translate(-50%, -50%) scale(1.2) rotate(-6deg); filter: hue-rotate(0deg) brightness(1.8); }
          32% { transform: translate(-50%, -50%) scale(1.35) rotate(4deg); filter: hue-rotate(-15deg) brightness(2); }
          50% { transform: translate(-50%, -50%) scale(1.3); filter: hue-rotate(0deg) brightness(1.7); }
          85% { opacity: 1; transform: translate(-50%, -50%) scale(1.25); }
          100% { opacity: 0; transform: translate(-50%, -110%) scale(1.4); filter: brightness(2.5); }
        }

        @keyframes burst-fire {
          0% { opacity: 0; transform: scale(0.3); }
          25% { opacity: 0.85; transform: scale(1.0); }
          100% { opacity: 0; transform: scale(1.4); }
        }
        @keyframes burst-blazing {
          0% { opacity: 0; transform: scale(0.25); }
          22% { opacity: 0.95; transform: scale(1.05); }
          100% { opacity: 0; transform: scale(1.6); }
        }
        @keyframes burst-inferno {
          0% { opacity: 0; transform: scale(0.2); }
          18% { opacity: 1; transform: scale(1.1); }
          50% { opacity: 0.6; transform: scale(1.3); }
          100% { opacity: 0; transform: scale(1.8); }
        }
        @keyframes burst-godlike {
          0% { opacity: 0; transform: scale(0.15); }
          12% { opacity: 1; transform: scale(1.2); }
          30% { opacity: 0.85; transform: scale(1.4); }
          60% { opacity: 0.7; transform: scale(1.6); }
          100% { opacity: 0; transform: scale(2.2); }
        }

        @keyframes vignette-fire {
          0% { opacity: 0; }
          20% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes vignette-blazing {
          0% { opacity: 0; }
          15% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 0; }
        }
        @keyframes vignette-inferno {
          0% { opacity: 0; }
          10% { opacity: 1; }
          30% { opacity: 0.7; }
          60% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes vignette-godlike {
          0% { opacity: 0; }
          8% { opacity: 1; }
          25% { opacity: 0.8; }
          45% { opacity: 1; }
          70% { opacity: 0.85; }
          100% { opacity: 0; }
        }

        @keyframes streak-fire {
          0% { opacity: 0; transform: translate(-50%, -100%) rotate(var(--rot, 0deg)) scaleY(0.3); }
          30% { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -120%) rotate(var(--rot, 0deg)) scaleY(1.6); }
        }
        @keyframes streak-blazing {
          0% { opacity: 0; transform: translate(-50%, -100%) rotate(var(--rot, 0deg)) scaleY(0.3); }
          25% { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -130%) rotate(var(--rot, 0deg)) scaleY(1.8); }
        }
        @keyframes streak-inferno {
          0% { opacity: 0; transform: translate(-50%, -100%) rotate(var(--rot, 0deg)) scaleY(0.2); }
          20% { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -150%) rotate(var(--rot, 0deg)) scaleY(2.0); }
        }
        @keyframes streak-godlike {
          0% { opacity: 0; transform: translate(-50%, -100%) rotate(var(--rot, 0deg)) scaleY(0.1); }
          15% { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -180%) rotate(var(--rot, 0deg)) scaleY(2.4); }
        }
      `}</style>
    </div>
  );
}
