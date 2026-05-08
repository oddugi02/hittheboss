import type { AchievementDef } from '../types/progression';

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_blood',
    title: 'First Blood',
    description: 'Deal your first 1,000 damage',
    reward: 100,
    check: (s) => s.totalDamage >= 1_000,
  },
  {
    id: 'warmed_up',
    title: 'Warmed Up',
    description: 'Deal a cumulative 50,000 damage',
    reward: 300,
    check: (s) => s.totalDamage >= 50_000,
  },
  {
    id: 'pain_train',
    title: 'Pain Train',
    description: 'Reach a 10x combo',
    reward: 250,
    check: (s) => s.bestCombo >= 10,
  },
  {
    id: 'combo_god',
    title: 'Combo God',
    description: 'Reach a 50x combo',
    reward: 1500,
    check: (s) => s.bestCombo >= 50,
  },
  {
    id: 'collector',
    title: 'Collector',
    description: 'Unlock 5 weapons',
    reward: 500,
    check: (s) => s.weaponsUnlocked >= 5,
  },
  {
    id: 'arsenal',
    title: 'Arsenal',
    description: 'Unlock all weapons',
    reward: 5000,
    check: (s) => s.weaponsUnlocked >= 14,
  },
  {
    id: 'stage_5',
    title: 'Veteran',
    description: 'Clear stage 5',
    reward: 1000,
    check: (s) => s.stagesCleared >= 5,
  },
  {
    id: 'stage_10',
    title: 'Boss Hunter',
    description: 'Clear stage 10',
    reward: 5000,
    check: (s) => s.stagesCleared >= 10,
  },
  {
    id: 'half_million',
    title: 'Heavy Hitter',
    description: 'Deal 500,000 cumulative damage',
    reward: 1500,
    check: (s) => s.totalDamage >= 500_000,
  },
  {
    id: 'million_club',
    title: 'Million Club',
    description: 'Deal 1,000,000 cumulative damage',
    reward: 3000,
    check: (s) => s.totalDamage >= 1_000_000,
  },
];

export const ACHIEVEMENT_BY_ID = ACHIEVEMENTS.reduce<Record<string, AchievementDef>>(
  (acc, a) => ({ ...acc, [a.id]: a }),
  {},
);
