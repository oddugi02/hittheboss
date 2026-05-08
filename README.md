# Beat the Boss 4

A 3D stress-relief game built with Next.js, React Three Fiber, and Rapier physics.
Pick up the boss, hurl weapons, climb stages, complete quests, and unlock 14 weapons.

## Features

- 14 unlockable / upgradeable weapons (Macaron → Desk)
- Combo-based scoring with stage-aware difficulty curve
- Boss patterns: guard, rage, evade, frozen / stun reactions
- Daily quests + random stage events (Coin Rush, Glass Boss, Iron Boss, Time Attack)
- 9 achievements with reward economy (coins)
- Local progression persistence (zustand persist)
- Optional cloud sync, anonymous auth, and global leaderboard via Supabase
- Boss appearance share codes (export / import)
- PNG screenshot export
- Per-weapon throw sound design via Web Audio API

## Local Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Optional: Enable Cloud Features (Free)

Cloud is fully optional. Without it the game runs entirely offline using
`localStorage`. To enable global leaderboard + cross-device save:

1. Create a free Supabase project ([supabase.com](https://supabase.com)).
2. In the Supabase SQL editor, run [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql).
3. In Supabase Auth → Providers → enable **Anonymous Sign-Ins**.
4. Copy `.env.local.example` to `.env.local` and fill in:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

5. Restart `npm run dev`.

If env vars are missing, the cloud sync layer becomes a no-op and the leaderboard
panel shows an inline notice.

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- React 19, Three.js, @react-three/fiber, @react-three/rapier, @react-three/drei
- Zustand 5 (with persist middleware)
- Supabase (optional)
- Web Audio API for SFX / BGM
