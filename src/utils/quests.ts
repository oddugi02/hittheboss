import type { DailyQuest, QuestKind, WeaponKey } from '../types/progression';

const QUEST_TEMPLATES: Array<{
  questId: string;
  kind: QuestKind;
  goal: number;
  reward: number;
  description: string;
  weaponKey?: WeaponKey;
}> = [
  { questId: 'damage_30k', kind: 'damage_total', goal: 30_000, reward: 250, description: 'Deal 30,000 damage' },
  { questId: 'damage_120k', kind: 'damage_total', goal: 120_000, reward: 600, description: 'Deal 120,000 damage' },
  { questId: 'combo_15', kind: 'combo_reach', goal: 15, reward: 350, description: 'Reach a 15x combo' },
  { questId: 'combo_30', kind: 'combo_reach', goal: 30, reward: 800, description: 'Reach a 30x combo' },
  { questId: 'stage_clear_2', kind: 'stage_clear', goal: 2, reward: 500, description: 'Clear 2 stages' },
  { questId: 'use_rock_30', kind: 'kills_with_weapon', weaponKey: 'rock', goal: 30, reward: 350, description: 'Hit boss 30 times with Rock' },
  { questId: 'use_book_50', kind: 'kills_with_weapon', weaponKey: 'book', goal: 50, reward: 350, description: 'Hit boss 50 times with Book' },
  { questId: 'use_arrow_25', kind: 'kills_with_weapon', weaponKey: 'arrow', goal: 25, reward: 500, description: 'Hit boss 25 times with Arrow' },
];

function dateSeed(dateString: string, salt = 0): number {
  let h = salt | 0;
  for (let i = 0; i < dateString.length; i++) {
    h = (h * 31 + dateString.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function generateDailyQuests(dateKey: string): DailyQuest[] {
  const seedA = dateSeed(dateKey, 7);
  const seedB = dateSeed(dateKey, 19);
  const seedC = dateSeed(dateKey, 53);
  const indices = [
    seedA % QUEST_TEMPLATES.length,
    seedB % QUEST_TEMPLATES.length,
    seedC % QUEST_TEMPLATES.length,
  ];
  const picked = new Set<number>();
  const result: DailyQuest[] = [];
  for (const i of indices) {
    let idx = i;
    while (picked.has(idx)) idx = (idx + 1) % QUEST_TEMPLATES.length;
    picked.add(idx);
    const t = QUEST_TEMPLATES[idx];
    result.push({
      ...t,
      progress: 0,
      completed: false,
      rewardClaimed: false,
    });
  }
  return result;
}
