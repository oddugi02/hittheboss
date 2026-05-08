'use client';

import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { ACHIEVEMENTS } from '../utils/achievements';

type Tab = 'records' | 'achievements' | 'quests';

export default function MetaPanel() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('records');

  const totalDamageEver = useGameStore((s) => s.totalDamageEver);
  const bestCombo = useGameStore((s) => s.bestCombo);
  const stagesCleared = useGameStore((s) => s.stagesCleared);
  const coins = useGameStore((s) => s.coins);
  const achievements = useGameStore((s) => s.achievements);
  const dailyQuests = useGameStore((s) => s.dailyQuests);
  const claimQuestReward = useGameStore((s) => s.claimQuestReward);
  const ensureDailyQuests = useGameStore((s) => s.ensureDailyQuests);
  const activeEvent = useGameStore((s) => s.activeEvent);

  useEffect(() => {
    ensureDailyQuests();
  }, [ensureDailyQuests]);

  // Notification: any quest is completed but reward not yet claimed.
  const claimableCount = useMemo(
    () => dailyQuests.filter((q) => q.completed && !q.rewardClaimed).length,
    [dailyQuests],
  );

  if (!open) {
    return (
      <button
        onClick={() => {
          setOpen(true);
          // Auto-jump to quests tab when there is an unclaimed reward so the
          // notification badge actually leads the player to the action.
          if (claimableCount > 0) setTab('quests');
        }}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          // SHOP(140px @ right:320) 옆에 16px 간격 → right = 320 + 140 + 16 = 476
          position: 'absolute', bottom: '24px', right: '476px', zIndex: 50,
          minWidth: '140px',
          background: 'linear-gradient(180deg,#9c27b0,#4a148c)',
          color: '#fff', border: '4px solid #111', borderRadius: '12px',
          padding: '12px 20px', fontSize: '20px',
          fontFamily: 'var(--font-display)',
          cursor: 'pointer', boxShadow: '4px 4px 0 #000',
          textShadow: '2px 2px 0 #000', WebkitTextStroke: '1px #000',
          pointerEvents: 'auto',
        }}
      >
        🏆 META
        {claimableCount > 0 && (
          <span
            aria-label={`${claimableCount} unclaimed quest reward${claimableCount > 1 ? 's' : ''}`}
            style={{
              position: 'absolute',
              top: -10,
              right: -10,
              minWidth: '26px',
              height: '26px',
              padding: '0 6px',
              background: 'linear-gradient(180deg,#ff5252,#b71c1c)',
              color: '#fff',
              border: '3px solid #111',
              borderRadius: '13px',
              fontSize: '15px',
              fontWeight: 900,
              lineHeight: '20px',
              textAlign: 'center',
              boxShadow: '0 0 0 2px rgba(255,82,82,0.45), 2px 2px 0 #000',
              animation: 'meta-badge-pulse 1.2s ease-in-out infinite',
              fontFamily: 'system-ui, sans-serif',
              WebkitTextStroke: 'initial',
              textShadow: 'none',
            }}
          >
            !
          </span>
        )}
        <style>{`
          @keyframes meta-badge-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.15); }
          }
        `}</style>
      </button>
    );
  }

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        zIndex: 60, width: '760px', maxHeight: '85vh',
        background: 'rgba(20,20,30,0.96)', border: '6px solid #111',
        borderRadius: '24px', padding: '24px',
        boxShadow: '8px 8px 0 rgba(0,0,0,0.5)',
        fontFamily: 'var(--font-display)',
        color: '#fff', overflowY: 'auto', pointerEvents: 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ color: '#ffd700', fontSize: '32px', margin: 0, textShadow: '2px 2px 0 #000', WebkitTextStroke: '1px #000' }}>
          PROGRESSION
        </h2>
        <button onClick={() => setOpen(false)} style={{
          background: '#f44336', color: '#fff', border: '3px solid #111', borderRadius: '50%',
          width: '40px', height: '40px', fontSize: '20px', cursor: 'pointer',
        }}>✕</button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {(['records', 'achievements', 'quests'] as const).map((t) => {
          const isQuestsWithBadge = t === 'quests' && claimableCount > 0;
          return (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1,
              position: 'relative',
              background: tab === t ? '#4caf50' : '#444', color: '#fff',
              border: '3px solid #111', borderRadius: '8px',
              padding: '8px', fontSize: '16px', cursor: 'pointer',
              fontFamily: 'inherit', textTransform: 'uppercase',
            }}>
              {t}
              {isQuestsWithBadge && (
                <span style={{
                  position: 'absolute', top: -6, right: -6,
                  minWidth: '20px', height: '20px', padding: '0 4px',
                  background: '#ff5252', color: '#fff',
                  border: '2px solid #111', borderRadius: '10px',
                  fontSize: '12px', lineHeight: '16px', fontWeight: 900,
                  fontFamily: 'system-ui, sans-serif',
                }}>{claimableCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {tab === 'records' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Stat label="Total Damage Ever" value={totalDamageEver.toLocaleString()} />
          <Stat label="Best Combo" value={`${bestCombo}x`} />
          <Stat label="Stages Cleared" value={stagesCleared.toLocaleString()} />
          <Stat label="Coins" value={`🪙 ${coins.toLocaleString()}`} />
          <Stat label="Active Event" value={`${activeEvent.label} — ${activeEvent.description}`} />
        </div>
      )}

      {tab === 'achievements' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {ACHIEVEMENTS.map((a) => {
            const unlocked = achievements.includes(a.id);
            return (
              <div key={a.id} style={{
                background: unlocked ? 'rgba(76,175,80,0.18)' : 'rgba(255,255,255,0.05)',
                border: `3px solid ${unlocked ? '#4caf50' : '#111'}`,
                borderRadius: '12px', padding: '12px',
              }}>
                <div style={{ fontSize: '18px', color: unlocked ? '#9ee493' : '#fff' }}>
                  {unlocked ? '✓ ' : ''}{a.title}
                </div>
                <div style={{ fontSize: '13px', color: '#ccc', marginTop: '4px' }}>{a.description}</div>
                <div style={{ fontSize: '12px', color: '#ffd700', marginTop: '4px' }}>Reward 🪙 {a.reward}</div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'quests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {dailyQuests.map((q) => {
            const pct = Math.min(100, Math.round((q.progress / q.goal) * 100));
            return (
              <div key={q.questId} style={{
                background: 'rgba(255,255,255,0.05)', border: '3px solid #111', borderRadius: '12px', padding: '12px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '18px' }}>{q.description}</span>
                  <span style={{ fontSize: '14px', color: '#ffd700' }}>🪙 {q.reward}</span>
                </div>
                <div style={{ marginTop: '8px', height: '12px', background: '#333', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: '#4caf50' }} />
                </div>
                <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#ccc' }}>
                    {Math.min(q.progress, q.goal).toLocaleString()} / {q.goal.toLocaleString()}
                  </span>
                  <button
                    disabled={!q.completed || q.rewardClaimed}
                    onClick={() => claimQuestReward(q.questId)}
                    style={{
                      background: q.rewardClaimed ? '#444' : (q.completed ? '#4caf50' : '#555'),
                      color: '#fff', border: '3px solid #111', borderRadius: '8px',
                      padding: '4px 12px', fontSize: '14px',
                      cursor: q.completed && !q.rewardClaimed ? 'pointer' : 'not-allowed',
                      fontFamily: 'inherit',
                    }}
                  >
                    {q.rewardClaimed ? 'CLAIMED' : (q.completed ? 'CLAIM' : 'IN PROGRESS')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      background: 'rgba(255,255,255,0.05)', border: '3px solid #111',
      borderRadius: '8px', padding: '8px 12px',
    }}>
      <span>{label}</span>
      <span style={{ color: '#ffd700' }}>{value}</span>
    </div>
  );
}
