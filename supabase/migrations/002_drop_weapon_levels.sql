-- Weapon leveling feature was removed. Drop the per-weapon level column from
-- existing profiles. New deployments are already covered by the updated 001
-- migration that no longer creates this column.
alter table if exists public.profiles
  drop column if exists weapon_levels;
