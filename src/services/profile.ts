'use client';

import { isCloudEnabled, supabase } from '../lib/supabase';
import type { Profile, WeaponKey } from '../types/progression';

export async function ensureAuth(): Promise<string | null> {
  if (!isCloudEnabled || !supabase) return null;
  const { data } = await supabase.auth.getUser();
  if (data.user) return data.user.id;
  const { data: signed, error } = await supabase.auth.signInAnonymously();
  if (error || !signed.user) return null;
  return signed.user.id;
}

export async function fetchProfile(): Promise<Profile | null> {
  if (!isCloudEnabled || !supabase) return null;
  const userId = await ensureAuth();
  if (!userId) return null;
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (!data) return null;
  return {
    userId: data.user_id,
    displayName: data.display_name,
    coins: data.coins ?? 0,
    bestCombo: data.best_combo ?? 0,
    totalDamage: Number(data.total_damage ?? 0),
    unlockedWeapons: (data.unlocked_weapons ?? []) as WeaponKey[],
    achievements: (data.achievements ?? []) as string[],
  };
}

export async function upsertProfile(profile: Profile): Promise<void> {
  if (!isCloudEnabled || !supabase) return;
  const userId = await ensureAuth();
  if (!userId) return;
  await supabase.from('profiles').upsert(
    {
      user_id: userId,
      display_name: profile.displayName,
      coins: profile.coins,
      best_combo: profile.bestCombo,
      total_damage: profile.totalDamage,
      unlocked_weapons: profile.unlockedWeapons,
      achievements: profile.achievements,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
}
