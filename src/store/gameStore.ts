'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  ActiveEvent, DailyQuest, WeaponKey, AchievementSnapshot,
} from '../types/progression';
import {
  WEAPONS, WEAPON_BY_KEY, STARTING_UNLOCKS,
  isWeaponUnlockReady, coinPerHitForStage,
} from '../utils/progression';
import { ACHIEVEMENTS } from '../utils/achievements';
import { generateDailyQuests, todayKey } from '../utils/quests';
import { rollEvent, damageMultiplierForEvent, coinMultiplierForEvent } from '../utils/events';

interface Particle {
  id: string;
  position: [number, number, number];
  createdAt: number;
}

interface HitText {
  id: string;
  text: string;
  position: [number, number, number];
  createdAt: number;
  color: string;
}

interface SpeechBubble {
  id: string;
  text: string;
  createdAt: number;
}

interface BossAppearance {
  name: string;
  gender: 'male' | 'female';
  // ── Body silhouette ──
  bodyType: 'slim' | 'average' | 'bulky';
  height: 'short' | 'average' | 'tall';
  // ── Skin / hair ──
  skinColor: string;
  eyeColor: string;
  hairColor: string;
  hairStyle: 'short' | 'long' | 'bald' | 'spiky' | 'mohawk' | 'bob' | 'bun' | 'pigtails';
  // ── Headwear ──
  hat: 'none' | 'cap' | 'crown' | 'tophat' | 'partyhat' | 'beanie' | 'horns' | 'halo';
  hatColor: string;
  // ── Face ──
  glassesStyle: 'none' | 'glasses' | 'sunglasses';
  facialHair: 'none' | 'mustache' | 'beard' | 'goatee' | 'stubble';
  eyebrowStyle: 'normal' | 'bushy' | 'thin' | 'unibrow';
  mouthStyle: 'neutral' | 'smile' | 'smirk' | 'grin' | 'frown';
  noseStyle: 'small' | 'normal' | 'big' | 'pointy';
  faceAccessory: 'none' | 'eyepatch' | 'scar' | 'mole' | 'mask' | 'bandage';
  // ── Outfit ──
  outfit: 'suit' | 'casual' | 'tracksuit' | 'hoodie' | 'royal';
  shirtColor: string;
  tieStyle: 'none' | 'long' | 'bowtie';
  tieColor: string;
  pantsColor: string;
  shoeColor: string;
}

type WeaponType = 'random' | WeaponKey;
type BackgroundType = 'office' | 'classroom' | 'room' | 'outside';

interface SavedPreset {
  name: string;
  appearance: BossAppearance;
}

interface GameState {
  // Core run state
  stress: number;
  maxStress: number;
  score: number;
  coins: number;
  stage: number;
  particles: Particle[];
  isDragging: boolean;
  appearance: BossAppearance;
  selectedWeapon: WeaponType;
  background: BackgroundType;
  recentDamage: number;

  // Combo
  combo: number;
  comboTimer: number;
  bestCombo: number;

  // Hit effects
  hitTexts: HitText[];
  speechBubbles: SpeechBubble[];

  // Damage phase visualization
  damageLevel: number;

  // Special states
  isFrozen: boolean;
  frozenTimer: number;
  isStunned: boolean;
  stunnedTimer: number;

  // Boss patterns
  bossGuardActive: boolean;
  bossGuardTimer: number;
  bossRageActive: boolean;
  bossEvadeActive: boolean;

  // Presets
  savedPresets: SavedPreset[];

  // Meta progression (persisted)
  unlockedWeapons: WeaponKey[];
  achievements: string[];
  totalDamageEver: number;
  stagesCleared: number;
  weaponHits: Partial<Record<WeaponKey, number>>;
  dailyQuests: DailyQuest[];
  dailyQuestsDate: string;

  // Active event
  activeEvent: ActiveEvent;

  // Run telemetry
  runStartedAt: number;

  // Audio settings (persisted)
  soundMuted: boolean;
  soundVolume: number;

  // Transient hype-feedback signals consumed by overlays. Each contains a
  // monotonically increasing token so consumers can detect "new" events
  // without subscribing to the entire object.
  lastCritAt: number;
  comboMilestone: { value: number; at: number } | null;
  // Active screen shake. Both fields are read on every frame by the shake
  // wrapper, so we use a single object to keep updates atomic.
  screenShake: {
    until: number;
    amp: number;     // peak translation amplitude in pixels
    rotAmp: number;  // peak rotation amplitude in degrees
    scaleAmp: number; // peak scale wobble (0 = no zoom)
  };

  // ── Actions ──
  addDamage: (amount: number, weaponKey?: WeaponKey) => void;
  decayRecentDamage: (amount: number) => void;
  addParticle: (position: [number, number, number]) => void;
  cleanupParticles: () => void;
  setIsDragging: (dragging: boolean) => void;
  updateAppearance: (updates: Partial<BossAppearance>) => void;
  setAppearance: (appearance: BossAppearance) => void;
  setSelectedWeapon: (weapon: WeaponType) => void;
  setBackground: (bg: BackgroundType) => void;
  addHitText: (text: string, position: [number, number, number], color: string) => void;
  cleanupHitTexts: () => void;
  addSpeechBubble: (text: string) => void;
  cleanupSpeechBubbles: () => void;
  tickCombo: (delta: number) => void;
  freezeBoss: () => void;
  stunBoss: () => void;
  tickFrozen: (delta: number) => void;
  tickStunned: (delta: number) => void;
  tickBossPatterns: (delta: number) => void;
  savePreset: (name: string) => void;
  loadPreset: (index: number) => void;
  deletePreset: (index: number) => void;
  nextStage: () => void;
  resetGame: () => void;

  // Shop / progression
  unlockWeapon: (key: WeaponKey) => boolean;

  // Audio
  toggleSoundMuted: () => void;
  setSoundVolume: (volume: number) => void;
  randomizeAppearance: () => void;
  resetAppearance: () => void;
  consumeComboMilestone: () => void;

  // Quests / achievements
  claimQuestReward: (questId: string) => boolean;
  ensureDailyQuests: () => void;
  evaluateAchievements: () => string[];

  // Cloud sync helpers
  applyCloudProfile: (profile: {
    coins: number;
    bestCombo: number;
    totalDamage: number;
    unlockedWeapons: WeaponKey[];
    achievements: string[];
  }) => void;
  recordRunCompletion: () => void;
}

const HIT_WORDS = ['BOOM!', 'CRACK!', 'POW!', 'SMACK!', 'WHAM!', 'BAM!', 'BONK!', 'THUD!'];
const HIT_COLORS = ['#ff4444', '#ff8800', '#ffcc00', '#ff00cc', '#ff6600', '#ee1111'];

const SPEECH_NORMAL = ['Ow!', 'Hey!', 'Stop it!', 'That hurts!', 'Help me!', 'Sorry already!'];
const SPEECH_ANGRY = ['One more time!', 'I am furious!', 'You will regret this!', 'Big trouble!'];
const SPEECH_HURT = ['Ugh...', 'Save me...', 'Stop...', 'It hurts...', 'Mom...'];

// ── Balance constants ──
// Boss HP at stage 1, then scales with HP_PER_STAGE_GROWTH per cleared stage.
// Tuned so a full stage 1 takes roughly 1.5–3 minutes with starter weapons,
// and later stages stay challenging without becoming a wall.
const BASE_BOSS_HP = 100_000;
const HP_PER_STAGE_GROWTH = 0.3;
// Slight defense ramp keeps later stages meaningful but is much milder than
// the previous 0.3 slope so HP scaling does most of the work.
const DEFENSE_PER_STAGE_GROWTH = 0.1;
// Single-hit damage cap relative to current max HP, before multipliers.
const SINGLE_HIT_DAMAGE_CAP_PCT = 0.01;
// Combo grants +12% damage per hit (was 10%) for a slightly snappier flow.
const COMBO_DAMAGE_PER_HIT = 0.12;
// Boss defenses become more forgiving in early stages and ramp gently.
const BOSS_GUARD_CHANCE_PER_SEC = 0.08;
const BOSS_EVADE_MIN_STAGE = 4;
const BOSS_EVADE_CHANCE = 0.25;
// Critical hits: 8% baseline chance → +50% damage and gold "CRITICAL!" text.
const CRIT_CHANCE = 0.08;
const CRIT_DAMAGE_MULT = 1.5;
// Combo milestones trigger fanfare + screen shake when first reached.
const COMBO_MILESTONES = [10, 25, 50, 100] as const;

function bossHpForStage(stage: number): number {
  const safeStage = Math.max(1, stage);
  return Math.round(BASE_BOSS_HP * (1 + (safeStage - 1) * HP_PER_STAGE_GROWTH));
}

// ── Randomization palette (mirrors what CustomizationMenu offers) ──
const RANDOM_PALETTE = {
  skin: [
    '#ffcdb2', '#ffbfa3', '#f1c27d', '#e0ac69', '#e2a37f', '#c98a6c',
    '#c68642', '#a05a2c', '#8d5524', '#5c3317',
    // Cartoon / fantasy tones
    '#a8e6cf', '#d4c5f9', '#ffd6a5',
  ],
  hair: [
    '#3e2723', '#111111', '#5c3a21', '#9e5a1b', '#d4af37', '#e2e2e2',
    '#bf4f51', '#4a154b',
    // Vivid styles
    '#ff5722', '#ff4081', '#651fff', '#00bcd4', '#76ff03',
  ],
  eye: [
    '#111111', '#2196f3', '#4caf50', '#795548', '#9c27b0', '#f44336',
    '#ffd700', '#ff5722', '#00e5ff',
  ],
  shirt: [
    '#3d5af1', '#f44336', '#4caf50', '#ff9800', '#9c27b0', '#212121',
    '#ffffff', '#e91e63', '#00bcd4', '#ffeb3b', '#3f51b5', '#8bc34a',
  ],
  tie: [
    '#3d5af1', '#f44336', '#4caf50', '#ff9800', '#9c27b0', '#212121',
    '#ffffff', '#e91e63', '#ffd700', '#1a237e',
  ],
  pants: [
    '#2d3a8c', '#1a1a1a', '#5d4037', '#607d8b', '#3e2723', '#009688',
    '#f44336', '#ffeb3b', '#37474f', '#4a148c',
  ],
  shoes: [
    '#5c3317', '#111111', '#ffffff', '#795548', '#f44336', '#2196f3',
    '#ffd700', '#1a237e',
  ],
  hat: [
    '#f44336', '#1976d2', '#212121', '#ffd700', '#4caf50', '#ff9800',
    '#9c27b0', '#ffffff', '#e91e63', '#00bcd4',
  ],
};
const RANDOM_HAIR_STYLES: BossAppearance['hairStyle'][] =
  ['short', 'long', 'bald', 'spiky', 'mohawk', 'bob', 'bun', 'pigtails'];
const RANDOM_GLASSES: BossAppearance['glassesStyle'][] = ['none', 'glasses', 'sunglasses'];
const RANDOM_FACIAL: BossAppearance['facialHair'][] = ['none', 'mustache', 'beard', 'goatee', 'stubble'];
const RANDOM_TIE: BossAppearance['tieStyle'][] = ['none', 'long', 'bowtie'];
const RANDOM_BODY: BossAppearance['bodyType'][] = ['slim', 'average', 'bulky'];
const RANDOM_HEIGHT: BossAppearance['height'][] = ['short', 'average', 'tall'];
const RANDOM_HAT: BossAppearance['hat'][] = ['none', 'cap', 'crown', 'tophat', 'partyhat', 'beanie', 'horns', 'halo'];
const RANDOM_OUTFIT: BossAppearance['outfit'][] = ['suit', 'casual', 'tracksuit', 'hoodie', 'royal'];
const RANDOM_EYEBROW: BossAppearance['eyebrowStyle'][] = ['normal', 'bushy', 'thin', 'unibrow'];
const RANDOM_MOUTH: BossAppearance['mouthStyle'][] = ['neutral', 'smile', 'smirk', 'grin', 'frown'];
const RANDOM_NOSE: BossAppearance['noseStyle'][] = ['small', 'normal', 'big', 'pointy'];
const RANDOM_FACE_ACC: BossAppearance['faceAccessory'][] = ['none', 'eyepatch', 'scar', 'mole', 'mask', 'bandage'];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rollRandomAppearance(preserveName: string): BossAppearance {
  const gender: BossAppearance['gender'] = Math.random() < 0.5 ? 'male' : 'female';
  return {
    name: preserveName,
    gender,
    bodyType: pick(RANDOM_BODY),
    height: pick(RANDOM_HEIGHT),
    skinColor: pick(RANDOM_PALETTE.skin),
    eyeColor: pick(RANDOM_PALETTE.eye),
    hairColor: pick(RANDOM_PALETTE.hair),
    hairStyle: pick(RANDOM_HAIR_STYLES),
    hat: pick(RANDOM_HAT),
    hatColor: pick(RANDOM_PALETTE.hat),
    glassesStyle: pick(RANDOM_GLASSES),
    // Facial hair only on male presentation looks natural with the existing models.
    facialHair: gender === 'male' ? pick(RANDOM_FACIAL) : 'none',
    eyebrowStyle: pick(RANDOM_EYEBROW),
    mouthStyle: pick(RANDOM_MOUTH),
    noseStyle: pick(RANDOM_NOSE),
    faceAccessory: pick(RANDOM_FACE_ACC),
    outfit: pick(RANDOM_OUTFIT),
    shirtColor: pick(RANDOM_PALETTE.shirt),
    tieStyle: pick(RANDOM_TIE),
    tieColor: pick(RANDOM_PALETTE.tie),
    pantsColor: pick(RANDOM_PALETTE.pants),
    shoeColor: pick(RANDOM_PALETTE.shoes),
  };
}

const baseAppearance: BossAppearance = {
  name: 'BOSS',
  gender: 'male',
  bodyType: 'average',
  height: 'average',
  skinColor: '#ffcdb2',
  eyeColor: '#111111',
  hairColor: '#3e2723',
  hairStyle: 'short',
  hat: 'none',
  hatColor: '#f44336',
  glassesStyle: 'none',
  facialHair: 'none',
  eyebrowStyle: 'normal',
  mouthStyle: 'neutral',
  noseStyle: 'normal',
  faceAccessory: 'none',
  outfit: 'suit',
  shirtColor: '#3d5af1',
  tieStyle: 'long',
  tieColor: '#e63946',
  pantsColor: '#2d3a8c',
  shoeColor: '#5c3317',
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      stress: BASE_BOSS_HP,
      maxStress: BASE_BOSS_HP,
      score: 0,
      coins: 0,
      stage: 1,
      particles: [],
      isDragging: false,
      selectedWeapon: 'random',
      background: 'office',
      recentDamage: 0,
      combo: 0,
      comboTimer: 0,
      bestCombo: 0,
      hitTexts: [],
      speechBubbles: [],
      damageLevel: 0,
      isFrozen: false,
      frozenTimer: 0,
      isStunned: false,
      stunnedTimer: 0,
      bossGuardActive: false,
      bossGuardTimer: 0,
      bossRageActive: false,
      bossEvadeActive: false,
      savedPresets: [],
      appearance: baseAppearance,

      unlockedWeapons: STARTING_UNLOCKS,
      achievements: [],
      totalDamageEver: 0,
      stagesCleared: 0,
      weaponHits: {},
      dailyQuests: generateDailyQuests(todayKey()),
      dailyQuestsDate: todayKey(),
      activeEvent: rollEvent(1),
      runStartedAt: Date.now(),
      soundMuted: false,
      soundVolume: 0.8,
      lastCritAt: 0,
      comboMilestone: null,
      screenShake: { until: 0, amp: 0, rotAmp: 0, scaleAmp: 0 },

      addDamage: (amount: number, weaponKey?: WeaponKey) =>
        set((state) => {
          const guardMult = state.bossGuardActive ? 0.1 : 1;
          const evadeMiss = state.bossEvadeActive && Math.random() < BOSS_EVADE_CHANCE;
          if (evadeMiss) {
            // Soften the punishment: missing keeps combo intact instead of resetting it.
            return { comboTimer: state.comboTimer };
          }

          const frozenMult = state.isFrozen ? 2 : 1;
          const rageMult = state.bossRageActive ? 0.7 : 1;
          const eventMult = damageMultiplierForEvent(state.activeEvent.modifier);
          const cappedAmount = Math.min(amount, state.maxStress * SINGLE_HIT_DAMAGE_CAP_PCT);
          const comboMultiplier = 1 + state.combo * COMBO_DAMAGE_PER_HIT;

          const defenseMult = 1 / (1 + (state.stage - 1) * DEFENSE_PER_STAGE_GROWTH);

          const isCrit = Math.random() < CRIT_CHANCE;
          const critMult = isCrit ? CRIT_DAMAGE_MULT : 1;

          const finalDamage =
            cappedAmount * comboMultiplier * frozenMult * defenseMult *
            guardMult * rageMult * eventMult * critMult;

          const newStress = Math.max(0, state.stress - finalDamage);
          // Per-hit coins scale with stage (5 → 20). Event modifier multiplies on top.
          // Crits also pay out the same multiplier on coins to reward the lucky hits.
          const baseCoinGain = coinPerHitForStage(state.stage);
          const earnedCoins = Math.round(
            baseCoinGain * coinMultiplierForEvent(state.activeEvent.modifier) * critMult,
          );
          const newCombo = state.combo + 1;

          // Detect newly-crossed milestone (10/25/50/100). Fires once per crossing.
          const justReachedMilestone = COMBO_MILESTONES.find(
            (m) => state.combo < m && newCombo >= m,
          );

          const healthPct = newStress / state.maxStress;
          const newDamageLevel =
            healthPct > 0.75 ? 0 :
            healthPct > 0.5 ? 1 :
            healthPct > 0.25 ? 2 :
            healthPct > 0 ? 3 : 4;

          const newWeaponHits = weaponKey
            ? { ...state.weaponHits, [weaponKey]: (state.weaponHits[weaponKey] ?? 0) + 1 }
            : state.weaponHits;

          const updatedQuests = state.dailyQuests.map((q) => {
            if (q.completed) return q;
            let progress = q.progress;
            if (q.kind === 'damage_total') progress += finalDamage;
            if (q.kind === 'combo_reach') progress = Math.max(progress, newCombo);
            if (q.kind === 'kills_with_weapon' && weaponKey && q.weaponKey === weaponKey) progress += 1;
            const completed = progress >= q.goal;
            return { ...q, progress, completed };
          });

          const now = Date.now();
          // Milestone-driven screen shake. Crit no longer triggers shake — the
          // visual feedback for crits is the boss's red emissive flash.
          let nextShake = state.screenShake;
          if (justReachedMilestone) {
            const params = justReachedMilestone === 100
              ? { ms: 1100, amp: 38, rot: 4.0, scale: 0.06 }
              : justReachedMilestone === 50
                ? { ms: 850,  amp: 28, rot: 3.0, scale: 0.04 }
                : justReachedMilestone === 25
                  ? { ms: 650, amp: 20, rot: 2.0, scale: 0.025 }
                  : { ms: 500, amp: 14, rot: 1.4, scale: 0.015 };
            // Only carry-over amplitudes from an active shake. Otherwise
            // start fresh so a small milestone doesn't inherit a previous
            // 100x burst's amplitude.
            const hasActive = state.screenShake.until > now;
            const base = hasActive
              ? state.screenShake
              : { until: 0, amp: 0, rotAmp: 0, scaleAmp: 0 };
            nextShake = {
              until: Math.max(base.until, now + params.ms),
              amp: Math.max(base.amp, params.amp),
              rotAmp: Math.max(base.rotAmp, params.rot),
              scaleAmp: Math.max(base.scaleAmp, params.scale),
            };
          }

          return {
            stress: newStress,
            score: state.score + Math.round(finalDamage),
            recentDamage: state.recentDamage + finalDamage,
            coins: state.coins + earnedCoins,
            combo: newCombo,
            comboTimer: 2,
            bestCombo: Math.max(state.bestCombo, newCombo),
            damageLevel: newDamageLevel,
            totalDamageEver: state.totalDamageEver + Math.round(finalDamage),
            weaponHits: newWeaponHits,
            dailyQuests: updatedQuests,
            bossRageActive: healthPct < 0.3 ? true : state.bossRageActive,
            lastCritAt: isCrit ? now : state.lastCritAt,
            comboMilestone: justReachedMilestone
              ? { value: justReachedMilestone, at: now }
              : state.comboMilestone,
            screenShake: nextShake,
          };
        }),

      decayRecentDamage: (amount: number) =>
        set((state) => {
          if (state.recentDamage === 0) return state;
          return { recentDamage: Math.max(0, state.recentDamage - amount) };
        }),

      addParticle: (position) =>
        set((state) => ({
          particles: [
            ...state.particles,
            { id: `${Date.now()}-${Math.random()}`, position, createdAt: Date.now() },
          ],
        })),

      cleanupParticles: () =>
        set((state) => {
          if (state.particles.length === 0) return state;
          const filtered = state.particles.filter((p) => Date.now() - p.createdAt < 800);
          if (filtered.length === state.particles.length) return state;
          return { particles: filtered };
        }),

      setIsDragging: (dragging) => set({ isDragging: dragging }),

      updateAppearance: (updates) =>
        set((state) => ({ appearance: { ...state.appearance, ...updates } })),

      setAppearance: (appearance) => set({ appearance }),

      setSelectedWeapon: (weapon) => set({ selectedWeapon: weapon }),

      setBackground: (bg) => set({ background: bg }),

      addHitText: (text, position, color) =>
        set((state) => ({
          hitTexts: [
            ...state.hitTexts.slice(-8),
            { id: `${Date.now()}-${Math.random()}`, text, position, createdAt: Date.now(), color },
          ],
        })),

      cleanupHitTexts: () =>
        set((state) => {
          if (state.hitTexts.length === 0) return state;
          const filtered = state.hitTexts.filter((h) => Date.now() - h.createdAt < 1200);
          if (filtered.length === state.hitTexts.length) return state;
          return { hitTexts: filtered };
        }),

      addSpeechBubble: (text) =>
        set((state) => ({
          speechBubbles: [
            ...state.speechBubbles.slice(-2),
            { id: `${Date.now()}-${Math.random()}`, text, createdAt: Date.now() },
          ],
        })),

      cleanupSpeechBubbles: () =>
        set((state) => {
          if (state.speechBubbles.length === 0) return state;
          const filtered = state.speechBubbles.filter((s) => Date.now() - s.createdAt < 2000);
          if (filtered.length === state.speechBubbles.length) return state;
          return { speechBubbles: filtered };
        }),

      tickCombo: (delta) =>
        set((state) => {
          if (state.comboTimer <= 0) return state.combo > 0 ? { combo: 0, comboTimer: 0 } : state;
          return { comboTimer: Math.max(0, state.comboTimer - delta) };
        }),

      freezeBoss: () => set({ isFrozen: true, frozenTimer: 3 }),
      stunBoss: () => set({ isStunned: true, stunnedTimer: 2 }),

      tickFrozen: (delta) =>
        set((state) => {
          if (!state.isFrozen) return state;
          const t = state.frozenTimer - delta;
          return t <= 0 ? { isFrozen: false, frozenTimer: 0 } : { frozenTimer: t };
        }),

      tickStunned: (delta) =>
        set((state) => {
          if (!state.isStunned) return state;
          const t = state.stunnedTimer - delta;
          return t <= 0 ? { isStunned: false, stunnedTimer: 0 } : { stunnedTimer: t };
        }),

      tickBossPatterns: (delta) =>
        set((state) => {
          let { bossGuardActive, bossGuardTimer, bossEvadeActive } = state;
          if (bossGuardActive) {
            bossGuardTimer -= delta;
            if (bossGuardTimer <= 0) {
              bossGuardActive = false;
              bossGuardTimer = 0;
            }
          } else if (state.stage >= 2 && Math.random() < delta * BOSS_GUARD_CHANCE_PER_SEC) {
            bossGuardActive = true;
            // Slightly shorter guard window so combo chains aren't punished as hard.
            bossGuardTimer = 1.0;
          }

          bossEvadeActive = state.stage >= BOSS_EVADE_MIN_STAGE;

          return { bossGuardActive, bossGuardTimer, bossEvadeActive };
        }),

      savePreset: (name) =>
        set((state) => ({
          // Cap at 10 presets, dropping the OLDEST entry first (FIFO) instead
          // of the most recent one, which is what slice(0, 9) was incorrectly
          // doing before.
          savedPresets: [
            ...state.savedPresets.slice(-9),
            { name, appearance: { ...state.appearance } },
          ],
        })),

      loadPreset: (index) =>
        set((state) => {
          const preset = state.savedPresets[index];
          if (!preset) return state;
          return { appearance: { ...preset.appearance } };
        }),

      deletePreset: (index) =>
        set((state) => ({
          savedPresets: state.savedPresets.filter((_, i) => i !== index),
        })),

      nextStage: () =>
        set((state) => {
          const newStage = state.stage + 1;
          const newMaxStress = bossHpForStage(newStage);
          const newEvent = rollEvent(newStage);
          return {
            stage: newStage,
            stress: newMaxStress,
            maxStress: newMaxStress,
            recentDamage: 0,
            combo: 0,
            comboTimer: 0,
            damageLevel: 0,
            isFrozen: false,
            frozenTimer: 0,
            isStunned: false,
            stunnedTimer: 0,
            bossGuardActive: false,
            bossGuardTimer: 0,
            bossRageActive: false,
            bossEvadeActive: false,
            stagesCleared: state.stagesCleared + 1,
            activeEvent: newEvent,
            runStartedAt: Date.now(),
          };
        }),

      resetGame: () =>
        set((state) => ({
          stress: BASE_BOSS_HP,
          maxStress: BASE_BOSS_HP,
          score: 0,
          stage: 1,
          particles: [],
          isDragging: false,
          recentDamage: 0,
          combo: 0,
          comboTimer: 0,
          hitTexts: [],
          speechBubbles: [],
          damageLevel: 0,
          isFrozen: false,
          frozenTimer: 0,
          isStunned: false,
          stunnedTimer: 0,
          bossGuardActive: false,
          bossGuardTimer: 0,
          bossRageActive: false,
          bossEvadeActive: false,
          activeEvent: rollEvent(1),
          runStartedAt: Date.now(),
          comboMilestone: null,
          screenShake: { until: 0, amp: 0, rotAmp: 0, scaleAmp: 0 },
          // keep meta progression
          coins: state.coins,
          bestCombo: state.bestCombo,
          unlockedWeapons: state.unlockedWeapons,
          achievements: state.achievements,
          totalDamageEver: state.totalDamageEver,
          stagesCleared: state.stagesCleared,
          weaponHits: state.weaponHits,
          dailyQuests: state.dailyQuests,
          dailyQuestsDate: state.dailyQuestsDate,
        })),

      unlockWeapon: (key) => {
        const state = get();
        if (state.unlockedWeapons.includes(key)) return false;
        const def = WEAPON_BY_KEY[key];
        if (!def) return false;
        // Sequential unlock: each locked weapon requires every cheaper locked
        // weapon to be unlocked first, regardless of how many coins the player has.
        if (!isWeaponUnlockReady(key, state.unlockedWeapons)) return false;
        if (state.coins < def.unlockCost) return false;
        set({
          coins: state.coins - def.unlockCost,
          unlockedWeapons: [...state.unlockedWeapons, key],
        });
        return true;
      },

      toggleSoundMuted: () => set((state) => ({ soundMuted: !state.soundMuted })),
      setSoundVolume: (volume: number) =>
        set(() => ({ soundVolume: Math.max(0, Math.min(1, volume)) })),

      // Picks a fully random appearance using the same enum values and color
      // palettes the customization UI exposes. The stored boss name is left
      // alone so the player doesn't lose their typed-in name on a shuffle.
      randomizeAppearance: () =>
        set((state) => ({ appearance: { ...rollRandomAppearance(state.appearance.name) } })),

      // Restores the boss to the default look. The user-typed name is
      // preserved (mirroring randomizeAppearance) — only visuals reset.
      resetAppearance: () =>
        set((state) => ({ appearance: { ...baseAppearance, name: state.appearance.name } })),

      consumeComboMilestone: () => set({ comboMilestone: null }),

      claimQuestReward: (questId) => {
        const state = get();
        const idx = state.dailyQuests.findIndex((q) => q.questId === questId);
        if (idx < 0) return false;
        const q = state.dailyQuests[idx];
        if (!q.completed || q.rewardClaimed) return false;
        const updated = state.dailyQuests.map((qq, i) =>
          i === idx ? { ...qq, rewardClaimed: true } : qq,
        );
        set({ dailyQuests: updated, coins: state.coins + q.reward });
        return true;
      },

      ensureDailyQuests: () => {
        const state = get();
        const today = todayKey();
        if (state.dailyQuestsDate !== today) {
          set({ dailyQuests: generateDailyQuests(today), dailyQuestsDate: today });
        }
      },

      evaluateAchievements: () => {
        const state = get();
        const snapshot: AchievementSnapshot = {
          totalDamage: state.totalDamageEver,
          bestCombo: state.bestCombo,
          stagesCleared: state.stagesCleared,
          weaponsUnlocked: state.unlockedWeapons.length,
        };
        const newlyEarned: string[] = [];
        for (const a of ACHIEVEMENTS) {
          if (state.achievements.includes(a.id)) continue;
          if (a.check(snapshot)) newlyEarned.push(a.id);
        }
        if (newlyEarned.length > 0) {
          const reward = newlyEarned
            .map((id) => ACHIEVEMENTS.find((a) => a.id === id)?.reward ?? 0)
            .reduce((a, b) => a + b, 0);
          set({
            achievements: [...state.achievements, ...newlyEarned],
            coins: state.coins + reward,
          });
        }
        return newlyEarned;
      },

      applyCloudProfile: (profile) =>
        set((state) => ({
          coins: Math.max(state.coins, profile.coins),
          bestCombo: Math.max(state.bestCombo, profile.bestCombo),
          totalDamageEver: Math.max(state.totalDamageEver, profile.totalDamage),
          unlockedWeapons: Array.from(new Set([...state.unlockedWeapons, ...profile.unlockedWeapons])),
          achievements: Array.from(new Set([...state.achievements, ...profile.achievements])),
        })),

      recordRunCompletion: () => {
        // placeholder; actual cloud submission is performed by the leaderboard service.
      },
    }),
    {
      name: 'btb-progression-v1',
      version: 2,
      // SSR-safe storage: only touch localStorage on the client. The factory is
      // lazy, but we still guard against accidental server-side evaluation.
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          // Inert in-memory fallback during any non-browser evaluation pass.
          const memory = new Map<string, string>();
          return {
            getItem: (k: string) => memory.get(k) ?? null,
            setItem: (k: string, v: string) => { memory.set(k, v); },
            removeItem: (k: string) => { memory.delete(k); },
          } as Storage;
        }
        return window.localStorage;
      }),
      // Default merge keeps any newly-introduced default fields from `currentState`
      // while preferring persisted values for the keys that actually live in storage.
      // For nested objects (`appearance`, `savedPresets[*].appearance`) we deep-
      // merge so that older saves get sensible defaults for newly added fields
      // (bodyType, hat, outfit, …) rather than crashing or rendering as undefined.
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<GameState> & {
          appearance?: Partial<BossAppearance>;
          savedPresets?: { name: string; appearance: Partial<BossAppearance> }[];
        };
        const mergedAppearance: BossAppearance = {
          ...currentState.appearance,
          ...(persisted.appearance ?? {}),
        };
        const mergedPresets: SavedPreset[] = (persisted.savedPresets ?? currentState.savedPresets).map((p) => ({
          name: p.name,
          appearance: { ...currentState.appearance, ...p.appearance },
        }));
        return {
          ...currentState,
          ...persisted,
          appearance: mergedAppearance,
          savedPresets: mergedPresets,
        };
      },
      partialize: (state) => ({
        coins: state.coins,
        bestCombo: state.bestCombo,
        unlockedWeapons: state.unlockedWeapons,
        achievements: state.achievements,
        totalDamageEver: state.totalDamageEver,
        stagesCleared: state.stagesCleared,
        savedPresets: state.savedPresets,
        appearance: state.appearance,
        dailyQuests: state.dailyQuests,
        dailyQuestsDate: state.dailyQuestsDate,
        weaponHits: state.weaponHits,
        soundMuted: state.soundMuted,
        soundVolume: state.soundVolume,
      }),
    },
  ),
);

export { HIT_WORDS, HIT_COLORS, SPEECH_NORMAL, SPEECH_ANGRY, SPEECH_HURT };
export { WEAPONS, WEAPON_BY_KEY };
export type { BossAppearance, BackgroundType, WeaponType, HitText, SpeechBubble, SavedPreset };
