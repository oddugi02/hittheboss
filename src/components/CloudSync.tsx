'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { fetchProfile, upsertProfile, ensureAuth } from '../services/profile';
import { isCloudEnabled } from '../lib/supabase';

export default function CloudSync() {
  const applyCloudProfile = useGameStore((s) => s.applyCloudProfile);
  const lastSyncRef = useRef(0);

  // Initial pull
  useEffect(() => {
    if (!isCloudEnabled) return;
    let cancelled = false;
    (async () => {
      await ensureAuth();
      const profile = await fetchProfile();
      if (!cancelled && profile) {
        applyCloudProfile({
          coins: profile.coins,
          bestCombo: profile.bestCombo,
          totalDamage: profile.totalDamage,
          unlockedWeapons: profile.unlockedWeapons,
          achievements: profile.achievements,
        });
      }
    })();
    return () => { cancelled = true; };
  }, [applyCloudProfile]);

  // Debounced push when meta state changes
  useEffect(() => {
    if (!isCloudEnabled) return;
    const unsub = useGameStore.subscribe((state) => {
      const now = Date.now();
      if (now - lastSyncRef.current < 5000) return;
      lastSyncRef.current = now;
      void upsertProfile({
        userId: 'self',
        displayName: state.appearance.name?.trim() || 'PLAYER',
        coins: state.coins,
        bestCombo: state.bestCombo,
        totalDamage: state.totalDamageEver,
        unlockedWeapons: state.unlockedWeapons,
        achievements: state.achievements,
      });
    });
    return () => unsub();
  }, []);

  return null;
}
