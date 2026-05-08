// Web Audio API based sound effects generator.
//
// All public play* helpers route through a single master GainNode so the UI can
// adjust volume / mute without touching individual oscillator chains. The
// master node is created lazily on the first audio operation so SSR doesn't
// trip on AudioContext.

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let muted = false;
let masterVolume = 0.8;

function ensureAudio() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctor = window.AudioContext
      || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = muted ? 0 : masterVolume;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') void audioCtx.resume();
  return audioCtx;
}

/** Set master volume in [0, 1]. Mute state is preserved separately. */
export function setMasterVolume(v: number) {
  masterVolume = Math.max(0, Math.min(1, v));
  if (masterGain) masterGain.gain.value = muted ? 0 : masterVolume;
}

/** Toggle or set mute. Returns the new muted state. */
export function setMuted(value: boolean): boolean {
  muted = value;
  if (masterGain) masterGain.gain.value = muted ? 0 : masterVolume;
  return muted;
}

/** Returns the master gain node for routing oscillators. Creates context if needed. */
function getDestination(): AudioNode | null {
  const ctx = ensureAudio();
  if (!ctx) return null;
  return masterGain ?? ctx.destination;
}

type ThrowSoundType =
  | 'macaron'
  | 'pencil'
  | 'book'
  | 'plate'
  | 'rock'
  | 'teapot'
  | 'chair'
  | 'desk'
  | 'arrow'
  | 'sword'
  | 'hammer'
  | 'bomb'
  | 'freeze'
  | 'banana';

const throwSoundMap: Record<ThrowSoundType, { type: OscillatorType; from: number; to: number; duration: number; gain: number }> = {
  macaron: { type: 'sine', from: 700, to: 280, duration: 0.12, gain: 0.09 },
  pencil: { type: 'triangle', from: 900, to: 320, duration: 0.1, gain: 0.12 },
  book: { type: 'square', from: 260, to: 120, duration: 0.18, gain: 0.14 },
  plate: { type: 'triangle', from: 1100, to: 450, duration: 0.08, gain: 0.1 },
  rock: { type: 'sawtooth', from: 220, to: 80, duration: 0.18, gain: 0.17 },
  teapot: { type: 'triangle', from: 500, to: 170, duration: 0.14, gain: 0.12 },
  chair: { type: 'square', from: 180, to: 70, duration: 0.2, gain: 0.2 },
  desk: { type: 'square', from: 140, to: 50, duration: 0.24, gain: 0.24 },
  arrow: { type: 'sine', from: 1800, to: 260, duration: 0.07, gain: 0.08 },
  sword: { type: 'triangle', from: 1200, to: 300, duration: 0.09, gain: 0.1 },
  hammer: { type: 'sawtooth', from: 210, to: 60, duration: 0.2, gain: 0.22 },
  bomb: { type: 'sawtooth', from: 170, to: 45, duration: 0.24, gain: 0.24 },
  freeze: { type: 'sine', from: 1000, to: 220, duration: 0.16, gain: 0.11 },
  banana: { type: 'triangle', from: 650, to: 240, duration: 0.11, gain: 0.1 },
};

// Throw sound: weapon-specific short whoosh
export function playThrowSound(weaponType: ThrowSoundType) {
  const dst = getDestination();
  if (!dst || !audioCtx) return;
  const cfg = throwSoundMap[weaponType];
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = cfg.type;
  osc.frequency.setValueAtTime(cfg.from, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(cfg.to, audioCtx.currentTime + cfg.duration);
  gain.gain.setValueAtTime(cfg.gain, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + cfg.duration);
  osc.connect(gain);
  gain.connect(dst);
  osc.start();
  osc.stop(audioCtx.currentTime + cfg.duration);
}

// Impact sound: heavy thud
export function playHitSound(intensity: number = 1) {
  const dst = getDestination();
  if (!dst || !audioCtx) return;
  const t = audioCtx.currentTime;

  // Low thump
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150 * intensity, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.2);
  gain.gain.setValueAtTime(0.4 * Math.min(intensity, 2), t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  osc.connect(gain);
  gain.connect(dst);
  osc.start(t);
  osc.stop(t + 0.25);

  // Noise burst for crunch
  const bufferSize = audioCtx.sampleRate * 0.08;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.3;
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0.25 * Math.min(intensity, 2), t);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  noise.connect(noiseGain);
  noiseGain.connect(dst);
  noise.start(t);
  noise.stop(t + 0.1);
}

// Boss pain sound: short yelp/groan
export function playPainSound(phase: string, gender: 'male' | 'female' = 'male') {
  const dst = getDestination();
  if (!dst || !audioCtx) return;
  const t = audioCtx.currentTime;
  const p = gender === 'female' ? 1.6 : 1; // Pitch multiplier

  if (phase === 'angry') {
    // Angry grunt
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120 * p, t);
    osc.frequency.linearRampToValueAtTime(80 * p, t + 0.3);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain);
    gain.connect(dst);
    osc.start(t);
    osc.stop(t + 0.3);
  } else if (phase === 'hurt') {
    // Pained whimper - descending tone
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500 * p, t);
    osc.frequency.exponentialRampToValueAtTime(200 * p, t + 0.4);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain);
    gain.connect(dst);
    osc.start(t);
    osc.stop(t + 0.4);

    // Vibrato for crying effect
    const vib = audioCtx.createOscillator();
    const vibGain = audioCtx.createGain();
    vib.type = 'triangle';
    vib.frequency.setValueAtTime(350 * p, t);
    vib.frequency.exponentialRampToValueAtTime(150 * p, t + 0.5);
    vibGain.gain.setValueAtTime(0.1, t + 0.1);
    vibGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    vib.connect(vibGain);
    vibGain.connect(dst);
    vib.start(t + 0.1);
    vib.stop(t + 0.5);
  } else if (phase === 'fainted') {
    // Knockout sound - descending + thud
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600 * p, t);
    osc.frequency.exponentialRampToValueAtTime(60 * p, t + 0.6);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.connect(gain);
    gain.connect(dst);
    osc.start(t);
    osc.stop(t + 0.6);
  }
}

// Critical hit: bright shimmer + zap to reinforce big-damage feedback.
export function playCriticalSound() {
  const dst = getDestination();
  if (!dst || !audioCtx) return;
  const t = audioCtx.currentTime;

  // Sparkly upward chirp
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(900, t);
  osc.frequency.exponentialRampToValueAtTime(2400, t + 0.18);
  gain.gain.setValueAtTime(0.18, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
  osc.connect(gain);
  gain.connect(dst);
  osc.start(t);
  osc.stop(t + 0.25);

  // Layered low thump for weight
  const thump = audioCtx.createOscillator();
  const thumpGain = audioCtx.createGain();
  thump.type = 'sine';
  thump.frequency.setValueAtTime(220, t);
  thump.frequency.exponentialRampToValueAtTime(70, t + 0.18);
  thumpGain.gain.setValueAtTime(0.22, t);
  thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
  thump.connect(thumpGain);
  thumpGain.connect(dst);
  thump.start(t);
  thump.stop(t + 0.25);
}

// Combo milestone fanfare: short rising arpeggio that scales with the milestone.
export function playComboMilestoneSound(milestone: number) {
  const dst = getDestination();
  if (!dst || !audioCtx) return;
  const t0 = audioCtx.currentTime;
  // Higher milestones get more notes / brighter timbre.
  const notes = milestone >= 100
    ? [523.25, 659.25, 783.99, 1046.5, 1318.5]
    : milestone >= 50
      ? [392, 523.25, 659.25, 783.99]
      : milestone >= 25
        ? [329.63, 415.3, 523.25]
        : [261.63, 329.63];
  notes.forEach((freq, i) => {
    const osc = audioCtx!.createOscillator();
    const gain = audioCtx!.createGain();
    const t = t0 + i * 0.06;
    osc.type = milestone >= 50 ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(gain);
    gain.connect(dst);
    osc.start(t);
    osc.stop(t + 0.2);
  });
}
