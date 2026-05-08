import type { WeaponDef, WeaponKey } from '../types/progression';

export const WEAPONS: WeaponDef[] = [
  { key: 'macaron', name: 'Macaron', unlockCost: 0, baseDamageMult: 2 },
  { key: 'pencil', name: 'Pencil', unlockCost: 0, baseDamageMult: 2.5 },
  { key: 'book', name: 'Book', unlockCost: 0, baseDamageMult: 2 },
  { key: 'plate', name: 'Plate', unlockCost: 300, baseDamageMult: 1.5 },
  { key: 'rock', name: 'Rock', unlockCost: 600, baseDamageMult: 4 },
  { key: 'teapot', name: 'Teapot', unlockCost: 1000, baseDamageMult: 2.5 },
  { key: 'arrow', name: 'Arrow', unlockCost: 1600, baseDamageMult: 4 },
  { key: 'banana', name: 'Banana', unlockCost: 2200, baseDamageMult: 2 },
  { key: 'freeze', name: 'Freeze', unlockCost: 3000, baseDamageMult: 3 },
  { key: 'sword', name: 'Sword', unlockCost: 4500, baseDamageMult: 8 },
  { key: 'hammer', name: 'Hammer', unlockCost: 6500, baseDamageMult: 10 },
  { key: 'chair', name: 'Chair', unlockCost: 9000, baseDamageMult: 6 },
  { key: 'bomb', name: 'Bomb', unlockCost: 13000, baseDamageMult: 12 },
  { key: 'desk', name: 'Desk', unlockCost: 20000, baseDamageMult: 15 },
];

export const WEAPON_BY_KEY: Record<WeaponKey, WeaponDef> = WEAPONS.reduce(
  (acc, w) => ({ ...acc, [w.key]: w }),
  {} as Record<WeaponKey, WeaponDef>,
);

export const STARTING_UNLOCKS: WeaponKey[] = ['macaron', 'pencil', 'book'];

// Locked weapons in unlock order (cheapest first). WEAPONS is already defined
// in ascending unlockCost, so this preserves the intended progression curve.
export const LOCKED_WEAPONS: WeaponDef[] = WEAPONS.filter((w) => w.unlockCost > 0);

/**
 * Returns true when `key` is the next weapon eligible to be unlocked,
 * i.e. every cheaper locked weapon has already been unlocked.
 * Starting weapons (unlockCost === 0) are not considered "unlockable" here.
 */
export function isWeaponUnlockReady(
  key: WeaponKey,
  unlockedWeapons: WeaponKey[],
): boolean {
  const idx = LOCKED_WEAPONS.findIndex((w) => w.key === key);
  if (idx < 0) return false;
  return LOCKED_WEAPONS.slice(0, idx).every((w) => unlockedWeapons.includes(w.key));
}

// ── Coin reward curve ──
// Per-hit coins start at 5 (stage 1) and scale linearly up to 20 by stage 6.
// The curve is intentionally a bit faster than a strict +2/stage so players
// can comfortably afford the next-tier weapon as soon as they clear a stage.
export const COIN_PER_HIT_MIN = 5;
export const COIN_PER_HIT_MAX = 20;
export const COIN_PER_HIT_STAGE_INCREMENT = 3;

/**
 * How many coins a single hit awards at the given stage, before any event
 * multipliers are applied. Clamped to [COIN_PER_HIT_MIN, COIN_PER_HIT_MAX].
 */
export function coinPerHitForStage(stage: number): number {
  const value = COIN_PER_HIT_MIN + (Math.max(1, stage) - 1) * COIN_PER_HIT_STAGE_INCREMENT;
  return Math.min(COIN_PER_HIT_MAX, Math.max(COIN_PER_HIT_MIN, value));
}
