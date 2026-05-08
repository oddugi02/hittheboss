import type { ActiveEvent, EventModifier } from '../types/progression';

const EVENTS: ActiveEvent[] = [
  { modifier: 'none', label: 'Normal', description: 'Standard rules apply' },
  { modifier: 'double_coins', label: 'Coin Rush', description: 'Coins gained doubled' },
  { modifier: 'glass_boss', label: 'Glass Boss', description: 'Boss takes 50% more damage but combo decays faster' },
  { modifier: 'iron_boss', label: 'Iron Boss', description: 'Boss takes 25% less damage but rewards 1.5x' },
  { modifier: 'time_attack', label: 'Time Attack', description: 'Random combo bursts boost damage' },
];

export function rollEvent(stage: number): ActiveEvent {
  if (stage === 1) return EVENTS[0];
  const idx = (stage * 7 + Date.now()) % EVENTS.length;
  return EVENTS[idx];
}

export function damageMultiplierForEvent(modifier: EventModifier): number {
  switch (modifier) {
    case 'glass_boss': return 1.5;
    case 'iron_boss': return 0.75;
    default: return 1;
  }
}

export function coinMultiplierForEvent(modifier: EventModifier): number {
  switch (modifier) {
    case 'double_coins': return 2;
    case 'iron_boss': return 1.5;
    default: return 1;
  }
}
