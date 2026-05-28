ALTER TABLE public.movie_streams
ADD COLUMN IF NOT EXISTS status text DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS last_checked_at timestamp with time zone DEFAULT NULL;

ALTER TABLE public.episode_streams
ADD COLUMN IF NOT EXISTS status text DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS last_checked_at timestamp with time zone DEFAULT NULL;