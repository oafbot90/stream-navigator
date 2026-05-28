-- Migration: prevent duplicate episodes + add still_path/air_date
-- Run in your Supabase SQL Editor (this project uses an external Supabase instance).

-- 1. Add columns (safe if rerun)
alter table public.series_episodes
  add column if not exists still_path text,
  add column if not exists air_date date;

-- 2. Remove any existing duplicates BEFORE creating the unique index
--    Keeps the oldest row per (series_id, season_number, episode_number)
delete from public.series_episodes a
using public.series_episodes b
where a.series_id = b.series_id
  and a.season_number = b.season_number
  and a.episode_number = b.episode_number
  and a.created_at > b.created_at;

-- 3. Unique index to block future duplicates
create unique index if not exists idx_unique_episode
  on public.series_episodes (series_id, season_number, episode_number);
