-- Beat the Boss - online progression schema
-- Apply with Supabase SQL editor or `supabase db push`

create extension if not exists "pgcrypto";

-- Profile keyed by auth user
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'PLAYER',
  coins integer not null default 0,
  best_combo integer not null default 0,
  total_damage bigint not null default 0,
  unlocked_weapons text[] not null default '{macaron,pencil,book}',
  achievements text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stage integer not null,
  damage bigint not null,
  best_combo integer not null,
  duration_ms integer not null,
  weapon_used text,
  created_at timestamptz not null default now()
);

create index if not exists runs_user_id_idx on public.runs(user_id);
create index if not exists runs_damage_idx on public.runs(damage desc);

create table if not exists public.daily_quests (
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_date date not null,
  quest_id text not null,
  goal integer not null,
  progress integer not null default 0,
  completed boolean not null default false,
  reward_claimed boolean not null default false,
  primary key (user_id, quest_date, quest_id)
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.runs enable row level security;
alter table public.daily_quests enable row level security;

create policy "profiles self read" on public.profiles
  for select using (auth.uid() = user_id);
create policy "profiles self upsert" on public.profiles
  for insert with check (auth.uid() = user_id);
create policy "profiles self update" on public.profiles
  for update using (auth.uid() = user_id);

-- Public read for leaderboard, write only by owner
create policy "runs public read" on public.runs
  for select using (true);
create policy "runs self insert" on public.runs
  for insert with check (auth.uid() = user_id);

create policy "quests self read" on public.daily_quests
  for select using (auth.uid() = user_id);
create policy "quests self upsert" on public.daily_quests
  for insert with check (auth.uid() = user_id);
create policy "quests self update" on public.daily_quests
  for update using (auth.uid() = user_id);
