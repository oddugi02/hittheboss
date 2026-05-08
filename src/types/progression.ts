export type WeaponKey =
  | 'macaron' | 'pencil' | 'book' | 'plate' | 'rock' | 'teapot'
  | 'chair' | 'desk' | 'arrow' | 'sword' | 'hammer'
  | 'bomb' | 'freeze' | 'banana';

export interface WeaponDef {
  key: WeaponKey;
  name: string;
  unlockCost: number;
  baseDamageMult: number;
}

export interface Profile {
  userId: string;
  displayName: string;
  coins: number;
  bestCombo: number;
  totalDamage: number;
  unlockedWeapons: WeaponKey[];
  achievements: string[];
}

export interface RunResult {
  stage: number;
  damage: number;
  bestCombo: number;
  durationMs: number;
  weaponUsed?: WeaponKey;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  damage: number;
  best_combo: number;
  stage: number;
  created_at: string;
}

export type QuestKind =
  | 'damage_total'
  | 'combo_reach'
  | 'kills_with_weapon'
  | 'stage_clear';

export interface DailyQuest {
  questId: string;
  kind: QuestKind;
  goal: number;
  reward: number;
  description: string;
  weaponKey?: WeaponKey;
  progress: number;
  completed: boolean;
  rewardClaimed: boolean;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  reward: number;
  check: (snapshot: AchievementSnapshot) => boolean;
}

export interface AchievementSnapshot {
  totalDamage: number;
  bestCombo: number;
  stagesCleared: number;
  weaponsUnlocked: number;
}

export type EventModifier =
  | 'none'
  | 'double_coins'
  | 'glass_boss'
  | 'iron_boss'
  | 'time_attack';

export interface ActiveEvent {
  modifier: EventModifier;
  label: string;
  description: string;
}
