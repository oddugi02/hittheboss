# Beat the Boss 4

A 3D stress-relief game built with Next.js, React Three Fiber, and Rapier
physics. Drag the boss around, hurl weapons, build combos, customize the
boss's appearance, and unlock the full weapon roster.

## Features

- **14 unlockable weapons** (Macaron → Desk), each with its own throw arc and
  sound. Coin payout per hit ramps from 5 → 20 across stages, so bigger fights
  pay better.
- **Combo system** with critical hits (5-10% chance, 1.5x damage, boss flashes
  red) and milestone effects at 10 / 25 / 50 / 100 combos (screen shake,
  full-screen tinted bursts, "FIRE / BLAZING / INFERNO / GOD-LIKE" text).
- **Boss patterns**: guard, rage, evade, frozen / stun reactions, scaled
  defense by stage.
- **Daily quests** + random stage events (Coin Rush, Glass Boss, Iron Boss,
  Time Attack) and 10+ achievements.
- **Deep boss customization** across 5 tabs (Body / Face / Hair / Outfit /
  Data): body type, height, skin/eye/hair color, hair styles, hats (cap,
  crown, top hat, beanie, party hat, horns, halo), facial hair, eyebrows,
  mouth, nose, face accessories (eyepatch, mask, scar, mole, bandage),
  outfits (suit, casual, hoodie, tracksuit, royal). Includes a 🎲 SURPRISE ME
  randomizer + named presets + base64 share codes.
- **Local progression persistence** via Zustand `persist` (with versioned
  migration so older saves merge cleanly when new appearance fields ship).
- **Optional cloud sync** + anonymous auth via Supabase.
- **PNG screenshot export** that composites the WebGL canvas with the boss's
  HTML name tag, plus a sound toggle / master volume slider.
- **Headless render endpoint** at `/render-boss?seed=...` used by the
  companion archive site (see below) to generate deterministic previews.

## Local Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Optional: Enable Cloud Sync (Free)

Cloud is fully optional. Without it the game runs entirely offline using
`localStorage`. To enable cross-device save:

1. Create a free Supabase project ([supabase.com](https://supabase.com)).
2. In the Supabase SQL editor, run
   [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql)
   then [`002_drop_weapon_levels.sql`](supabase/migrations/002_drop_weapon_levels.sql).
3. In Supabase Auth → Providers → enable **Anonymous Sign-Ins**.
4. Copy `.env.local.example` to `.env.local` and fill in:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

5. Restart `npm run dev`. If env vars are missing, the cloud layer no-ops and
   the in-game cloud notice explains it.

## Companion Archive

A separate Next.js project that catalogs randomly-generated bosses as PNGs by
scraping `/render-boss?seed=...` with Playwright. Useful for showcasing
customization variety. Repo: `boss-archive`.

## Tech Stack

- Next.js 16 (App Router, Turbopack) + React 19
- Three.js via `@react-three/fiber`, `@react-three/drei`, `@react-three/rapier`
- Zustand 5 (with versioned `persist` migration)
- Web Audio API for SFX (programmatic, no audio assets shipped)
- Supabase (optional)
