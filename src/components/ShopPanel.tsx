'use client';

import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { WEAPONS, isWeaponUnlockReady } from '../utils/progression';

export default function ShopPanel() {
  const [open, setOpen] = useState(false);
  const coins = useGameStore((s) => s.coins);
  const unlockedWeapons = useGameStore((s) => s.unlockedWeapons);
  const unlockWeapon = useGameStore((s) => s.unlockWeapon);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          // CUSTOMIZE BOSS(280px @ right:24) 옆에 16px 간격 → right = 24 + 280 + 16 = 320
          position: 'absolute', bottom: '24px', right: '320px', zIndex: 50,
          minWidth: '140px',
          background: 'linear-gradient(180deg,#ffb300,#e65100)',
          color: '#fff', border: '4px solid #111', borderRadius: '12px',
          padding: '12px 20px', fontSize: '20px',
          fontFamily: 'var(--font-display)',
          cursor: 'pointer', boxShadow: '4px 4px 0 #000',
          textShadow: '2px 2px 0 #000', WebkitTextStroke: '1px #000',
          pointerEvents: 'auto',
        }}
      >
        🛒 SHOP
      </button>
    );
  }

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        zIndex: 60, width: '720px', maxHeight: '80vh',
        background: 'rgba(20,20,30,0.96)', border: '6px solid #111',
        borderRadius: '24px', padding: '24px',
        boxShadow: '8px 8px 0 rgba(0,0,0,0.5)',
        fontFamily: 'var(--font-display)',
        color: '#fff', overflowY: 'auto', pointerEvents: 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ color: '#ffd700', fontSize: '32px', margin: 0, textShadow: '2px 2px 0 #000', WebkitTextStroke: '1px #000' }}>
          WEAPON SHOP
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '22px', color: '#ffd700', textShadow: '2px 2px 0 #000' }}>
            🪙 {coins.toLocaleString()}
          </span>
          <button onClick={() => setOpen(false)} style={{
            background: '#f44336', color: '#fff', border: '3px solid #111', borderRadius: '50%',
            width: '40px', height: '40px', fontSize: '20px', cursor: 'pointer',
          }}>✕</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {WEAPONS.map((w) => {
          const isUnlocked = unlockedWeapons.includes(w.key);
          const cost = w.unlockCost;
          const canAfford = coins >= cost;
          // Sequential unlock gate: a locked weapon is only purchasable if every
          // cheaper locked weapon has already been unlocked.
          const isReady = isUnlocked || w.unlockCost === 0
            ? true
            : isWeaponUnlockReady(w.key, unlockedWeapons);
          const buyable = !isUnlocked && isReady && canAfford;

          return (
            <div key={w.key} style={{
              background: 'rgba(255,255,255,0.06)',
              border: '3px solid #111', borderRadius: '12px',
              padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px',
              opacity: !isUnlocked && !isReady ? 0.5 : 1,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '20px', color: '#ffd700', textShadow: '1px 1px 0 #000' }}>{w.name}</span>
                {isUnlocked ? (
                  <span style={{ fontSize: '14px', color: '#9ee493' }}>UNLOCKED</span>
                ) : !isReady ? (
                  <span style={{ fontSize: '14px', color: '#bbbbbb' }}>🔒 LOCKED PATH</span>
                ) : (
                  <span style={{ fontSize: '14px', color: '#ff6b6b' }}>LOCKED</span>
                )}
              </div>

              <div style={{ fontSize: '13px', color: '#ccc' }}>
                Base mult x{w.baseDamageMult}
              </div>

              <button
                disabled={isUnlocked || !buyable}
                onClick={() => {
                  if (!isUnlocked && buyable) unlockWeapon(w.key);
                }}
                style={{
                  marginTop: 'auto',
                  background: isUnlocked
                    ? '#444'
                    : buyable
                      ? 'linear-gradient(180deg,#4caf50,#2e7d32)'
                      : '#555',
                  color: '#fff', border: '3px solid #111', borderRadius: '8px',
                  padding: '8px', fontSize: '16px',
                  cursor: (isUnlocked || !buyable) ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: (isUnlocked || !buyable) ? 'none' : '3px 3px 0 #000',
                }}
              >
                {isUnlocked
                  ? 'OWNED'
                  : !isReady
                    ? `먼저 이전 자물쇠를 언락해야 합니다`
                    : `Unlock · 🪙 ${cost.toLocaleString()}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
