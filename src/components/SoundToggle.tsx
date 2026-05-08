'use client';

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';

/**
 * Top-right speaker icon. Click to mute/unmute, hover or focus to expand a
 * volume slider. Tucked into a corner so it doesn't compete with primary HUD.
 */
export default function SoundToggle() {
  const muted = useGameStore((s) => s.soundMuted);
  const volume = useGameStore((s) => s.soundVolume);
  const toggle = useGameStore((s) => s.toggleSoundMuted);
  const setVolume = useGameStore((s) => s.setSoundVolume);
  const [expanded, setExpanded] = useState(false);
  const collapseTimer = useRef<number | null>(null);

  // Auto-collapse the slider 1.5s after mouse leaves so it stops blocking the
  // bouncing CLICK TO THROW! hint when not in use.
  useEffect(() => {
    return () => {
      if (collapseTimer.current) window.clearTimeout(collapseTimer.current);
    };
  }, []);

  const scheduleCollapse = () => {
    if (collapseTimer.current) window.clearTimeout(collapseTimer.current);
    collapseTimer.current = window.setTimeout(() => setExpanded(false), 1500);
  };
  const cancelCollapse = () => {
    if (collapseTimer.current) {
      window.clearTimeout(collapseTimer.current);
      collapseTimer.current = null;
    }
  };

  const icon = muted ? '🔇' : volume > 0.66 ? '🔊' : volume > 0.2 ? '🔉' : '🔈';

  return (
    <div
      onMouseEnter={() => { cancelCollapse(); setExpanded(true); }}
      onMouseLeave={() => scheduleCollapse()}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: '24px',
        right: '24px',
        zIndex: 60,
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'rgba(0,0,0,0.55)',
        border: '3px solid #111',
        borderRadius: '999px',
        padding: '6px 12px',
        boxShadow: '3px 3px 0 #000',
        backdropFilter: 'blur(4px)',
        transition: 'width 0.2s ease',
      }}
    >
      <button
        onClick={toggle}
        title={muted ? '소리 켜기' : '음소거'}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: '2px solid #111',
          background: muted ? 'linear-gradient(180deg,#777,#333)' : 'linear-gradient(180deg,#4caf50,#2e7d32)',
          color: '#fff',
          fontSize: '18px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        }}
      >
        {icon}
      </button>
      {expanded && (
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          aria-label="Master volume"
          style={{
            width: '120px',
            accentColor: '#4caf50',
            cursor: 'pointer',
          }}
        />
      )}
    </div>
  );
}
