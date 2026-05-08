'use client';

import { isCloudEnabled, supabase } from '../lib/supabase';
import type { LeaderboardEntry, RunResult } from '../types/progression';

export async function submitRun(run: RunResult, displayName: string): Promise<void> {
  if (!isCloudEnabled || !supabase) return;
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;

  await supabase.from('runs').insert({
    user_id: userId,
    stage: run.stage,
    damage: run.damage,
    best_combo: run.bestCombo,
    duration_ms: run.durationMs,
    weapon_used: run.weaponUsed ?? null,
  });

  await supabase
    .from('profiles')
    .upsert(
      {
        user_id: userId,
        display_name: displayName,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
}

export async function fetchTopRuns(limit = 20): Promise<LeaderboardEntry[]> {
  if (!isCloudEnabled || !supabase) return [];

  const { data, error } = await supabase
    .from('runs')
    .select('user_id, stage, damage, best_combo, created_at, profiles!inner(display_name)')
    .order('damage', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return (data as unknown as Array<{
    user_id: string;
    stage: number;
    damage: number;
    best_combo: number;
    created_at: string;
    profiles: { display_name: string };
  }>).map((row) => ({
    user_id: row.user_id,
    display_name: row.profiles?.display_name ?? 'PLAYER',
    damage: row.damage,
    best_combo: row.best_combo,
    stage: row.stage,
    created_at: row.created_at,
  }));
}
