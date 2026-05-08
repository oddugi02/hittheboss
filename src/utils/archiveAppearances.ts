import type { BossAppearance } from '../store/gameStore';

export interface ArchiveItem {
  id: string;
  seed: string;
  name: string;
  tags: string[];
  appearance: BossAppearance;
  image: string;
}

const PALETTES = {
  skin: [
    '#ffcdb2', '#ffbfa3', '#f1c27d', '#e0ac69', '#e2a37f', '#c98a6c',
    '#c68642', '#a05a2c', '#8d5524', '#5c3317', '#a8e6cf', '#d4c5f9', '#ffd6a5',
  ],
  hair: [
    '#3e2723', '#111111', '#5c3a21', '#9e5a1b', '#d4af37', '#e2e2e2',
    '#bf4f51', '#4a154b', '#ff5722', '#ff4081', '#651fff', '#00bcd4', '#76ff03',
  ],
  eye: ['#111111', '#2196f3', '#4caf50', '#795548', '#9c27b0', '#f44336', '#ffd700', '#ff5722', '#00e5ff'],
  shirt: [
    '#3d5af1', '#f44336', '#4caf50', '#ff9800', '#9c27b0', '#212121',
    '#ffffff', '#e91e63', '#00bcd4', '#ffeb3b', '#3f51b5', '#8bc34a',
  ],
  tie: ['#3d5af1', '#f44336', '#4caf50', '#ff9800', '#9c27b0', '#212121', '#ffffff', '#e91e63', '#ffd700', '#1a237e'],
  pants: ['#2d3a8c', '#1a1a1a', '#5d4037', '#607d8b', '#3e2723', '#009688', '#f44336', '#ffeb3b', '#37474f', '#4a148c'],
  shoes: ['#5c3317', '#111111', '#ffffff', '#795548', '#f44336', '#2196f3', '#ffd700', '#1a237e'],
  hat: ['#f44336', '#1976d2', '#212121', '#ffd700', '#4caf50', '#ff9800', '#9c27b0', '#ffffff', '#e91e63', '#00bcd4'],
} as const;

const OPTIONS = {
  gender: ['male', 'female'],
  bodyType: ['slim', 'average', 'bulky'],
  height: ['short', 'average', 'tall'],
  hairStyle: ['short', 'long', 'bald', 'spiky', 'mohawk', 'bob', 'bun', 'pigtails'],
  hat: ['none', 'cap', 'crown', 'tophat', 'partyhat', 'beanie', 'horns', 'halo'],
  glassesStyle: ['none', 'glasses', 'sunglasses'],
  facialHair: ['none', 'mustache', 'beard', 'goatee', 'stubble'],
  eyebrowStyle: ['normal', 'bushy', 'thin', 'unibrow'],
  mouthStyle: ['neutral', 'smile', 'smirk', 'grin', 'frown'],
  noseStyle: ['small', 'normal', 'big', 'pointy'],
  faceAccessory: ['none', 'eyepatch', 'scar', 'mole', 'mask', 'bandage'],
  outfit: ['suit', 'casual', 'tracksuit', 'hoodie', 'royal'],
  tieStyle: ['none', 'long', 'bowtie'],
} as const;

const NAME_LEFT = [
  'Mika', 'Raven', 'God', 'Wind', 'Venom', 'Gon', 'Katana', 'Boss', 'Pixel',
  'Thunder', 'Captain', 'Professor', 'Lucky', 'Turbo', 'Shadow', 'Crown',
];
const NAME_RIGHT = [
  'Ackerman', 'Shank', 'Force', 'Freccss', 'Spark', 'Punch', 'Mantis', 'Duck',
  'Ninja', 'Nova', 'Goblin', 'Cookie', 'Tiger', 'Wizard', 'Bandage', 'Halo',
];

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    let t = seed += 0x6d2b79f5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function picker(seed: string) {
  const rand = mulberry32(hashSeed(seed));
  return {
    one<T>(arr: readonly T[]): T {
      return arr[Math.floor(rand() * arr.length)];
    },
    chance(probability: number) {
      return rand() < probability;
    },
  };
}

export function createArchiveAppearance(seed: string): BossAppearance {
  const p = picker(seed);
  const gender = p.one(OPTIONS.gender) as BossAppearance['gender'];
  const outfit = p.one(OPTIONS.outfit) as BossAppearance['outfit'];
  const hat = p.one(OPTIONS.hat) as BossAppearance['hat'];

  return {
    name: `${p.one(NAME_LEFT)} ${p.one(NAME_RIGHT)}`,
    gender,
    bodyType: p.one(OPTIONS.bodyType) as BossAppearance['bodyType'],
    height: p.one(OPTIONS.height) as BossAppearance['height'],
    skinColor: p.one(PALETTES.skin),
    eyeColor: p.one(PALETTES.eye),
    hairColor: p.one(PALETTES.hair),
    hairStyle: p.one(OPTIONS.hairStyle) as BossAppearance['hairStyle'],
    hat,
    hatColor: p.one(PALETTES.hat),
    glassesStyle: p.one(OPTIONS.glassesStyle) as BossAppearance['glassesStyle'],
    facialHair: gender === 'male' ? p.one(OPTIONS.facialHair) as BossAppearance['facialHair'] : 'none',
    eyebrowStyle: p.one(OPTIONS.eyebrowStyle) as BossAppearance['eyebrowStyle'],
    mouthStyle: p.one(OPTIONS.mouthStyle) as BossAppearance['mouthStyle'],
    noseStyle: p.one(OPTIONS.noseStyle) as BossAppearance['noseStyle'],
    faceAccessory: p.one(OPTIONS.faceAccessory) as BossAppearance['faceAccessory'],
    outfit,
    shirtColor: p.one(PALETTES.shirt),
    tieStyle: outfit === 'suit' ? p.one(OPTIONS.tieStyle) as BossAppearance['tieStyle'] : 'none',
    tieColor: p.one(PALETTES.tie),
    pantsColor: p.one(PALETTES.pants),
    shoeColor: p.one(PALETTES.shoes),
  };
}

export function createArchiveItem(seed: string): ArchiveItem {
  const appearance = createArchiveAppearance(seed);
  const rawTags: Array<string | null> = [
    appearance.gender,
    appearance.bodyType,
    appearance.height,
    appearance.hairStyle,
    appearance.outfit,
    appearance.hat !== 'none' ? appearance.hat : null,
    appearance.faceAccessory !== 'none' ? appearance.faceAccessory : null,
    appearance.glassesStyle !== 'none' ? appearance.glassesStyle : null,
  ];
  const tags = rawTags.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0);

  return {
    id: seed,
    seed,
    name: appearance.name,
    tags,
    appearance,
    image: `/sprites/${seed}.png`,
  };
}

export function archiveSeed(index: number): string {
  return `boss-${String(index + 1).padStart(5, '0')}`;
}

