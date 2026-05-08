import type { BossAppearance } from '../store/gameStore';

// All allowed enum values for BossAppearance discrete fields. These mirror
// the union types defined on BossAppearance — keep them in sync.
const ALLOWED_GENDER = new Set(['male', 'female']);
const ALLOWED_BODY = new Set(['slim', 'average', 'bulky']);
const ALLOWED_HEIGHT = new Set(['short', 'average', 'tall']);
const ALLOWED_HAIR = new Set(['short', 'long', 'bald', 'spiky', 'mohawk', 'bob', 'bun', 'pigtails']);
const ALLOWED_HAT = new Set(['none', 'cap', 'crown', 'tophat', 'partyhat', 'beanie', 'horns', 'halo']);
const ALLOWED_GLASSES = new Set(['none', 'glasses', 'sunglasses']);
const ALLOWED_FACIAL = new Set(['none', 'mustache', 'beard', 'goatee', 'stubble']);
const ALLOWED_EYEBROW = new Set(['normal', 'bushy', 'thin', 'unibrow']);
const ALLOWED_MOUTH = new Set(['neutral', 'smile', 'smirk', 'grin', 'frown']);
const ALLOWED_NOSE = new Set(['small', 'normal', 'big', 'pointy']);
const ALLOWED_FACE_ACC = new Set(['none', 'eyepatch', 'scar', 'mole', 'mask', 'bandage']);
const ALLOWED_OUTFIT = new Set(['suit', 'casual', 'tracksuit', 'hoodie', 'royal']);
const ALLOWED_TIE = new Set(['none', 'long', 'bowtie']);

const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;
const MAX_NAME_LENGTH = 24;

function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR.test(value);
}

/**
 * Encode a BossAppearance into a portable, copy-pasteable code.
 * Uses base64 over a UTF-8 byte representation so Korean / emoji names
 * survive the round trip.
 */
export function encodeAppearance(appearance: BossAppearance): string {
  try {
    if (typeof window === 'undefined') return '';
    const json = JSON.stringify(appearance);
    // btoa requires a binary string. encodeURIComponent → unescape converts
    // the JSON string to a sequence of bytes that btoa will accept.
    return btoa(unescape(encodeURIComponent(json)));
  } catch {
    return '';
  }
}

/**
 * Decode a share code produced by `encodeAppearance` back into a strongly
 * validated BossAppearance. Returns `null` on any parsing or validation error
 * so the caller can surface a friendly message instead of trusting raw input.
 *
 * The decoder is forward-compatible: any newly added enum field defaults to
 * a sensible base value when the incoming code predates it. This means a
 * code shared from an older client still imports cleanly today.
 */
export function decodeAppearance(code: string): BossAppearance | null {
  if (typeof window === 'undefined') return null;

  let parsed: unknown;
  try {
    const json = decodeURIComponent(escape(atob(code.trim())));
    parsed = JSON.parse(json);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object') return null;
  const p = parsed as Record<string, unknown>;

  // ── Required core fields ──
  if (typeof p.name !== 'string' || p.name.length === 0 || p.name.length > MAX_NAME_LENGTH) return null;
  if (typeof p.gender !== 'string' || !ALLOWED_GENDER.has(p.gender)) return null;
  if (typeof p.hairStyle !== 'string' || !ALLOWED_HAIR.has(p.hairStyle)) return null;
  if (typeof p.glassesStyle !== 'string' || !ALLOWED_GLASSES.has(p.glassesStyle)) return null;
  if (typeof p.facialHair !== 'string' || !ALLOWED_FACIAL.has(p.facialHair)) return null;
  if (typeof p.tieStyle !== 'string' || !ALLOWED_TIE.has(p.tieStyle)) return null;

  if (
    !isHexColor(p.skinColor) ||
    !isHexColor(p.eyeColor) ||
    !isHexColor(p.hairColor) ||
    !isHexColor(p.shirtColor) ||
    !isHexColor(p.tieColor) ||
    !isHexColor(p.pantsColor) ||
    !isHexColor(p.shoeColor)
  ) {
    return null;
  }

  // ── Optional / forward-compatible fields with safe defaults ──
  const optionalEnum = <T extends string>(value: unknown, allowed: Set<string>, fallback: T): T =>
    typeof value === 'string' && allowed.has(value) ? (value as T) : fallback;
  const optionalColor = (value: unknown, fallback: string): string =>
    isHexColor(value) ? value : fallback;

  return {
    name: p.name,
    gender: p.gender as BossAppearance['gender'],
    bodyType: optionalEnum<BossAppearance['bodyType']>(p.bodyType, ALLOWED_BODY, 'average'),
    height: optionalEnum<BossAppearance['height']>(p.height, ALLOWED_HEIGHT, 'average'),
    skinColor: p.skinColor,
    eyeColor: p.eyeColor,
    hairColor: p.hairColor,
    hairStyle: p.hairStyle as BossAppearance['hairStyle'],
    hat: optionalEnum<BossAppearance['hat']>(p.hat, ALLOWED_HAT, 'none'),
    hatColor: optionalColor(p.hatColor, '#f44336'),
    glassesStyle: p.glassesStyle as BossAppearance['glassesStyle'],
    facialHair: p.facialHair as BossAppearance['facialHair'],
    eyebrowStyle: optionalEnum<BossAppearance['eyebrowStyle']>(p.eyebrowStyle, ALLOWED_EYEBROW, 'normal'),
    mouthStyle: optionalEnum<BossAppearance['mouthStyle']>(p.mouthStyle, ALLOWED_MOUTH, 'neutral'),
    noseStyle: optionalEnum<BossAppearance['noseStyle']>(p.noseStyle, ALLOWED_NOSE, 'normal'),
    faceAccessory: optionalEnum<BossAppearance['faceAccessory']>(p.faceAccessory, ALLOWED_FACE_ACC, 'none'),
    outfit: optionalEnum<BossAppearance['outfit']>(p.outfit, ALLOWED_OUTFIT, 'suit'),
    shirtColor: p.shirtColor,
    tieStyle: p.tieStyle as BossAppearance['tieStyle'],
    tieColor: p.tieColor,
    pantsColor: p.pantsColor,
    shoeColor: p.shoeColor,
  };
}
