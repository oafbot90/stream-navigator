-- Remove duplicate movie_streams keeping only the first one
DELETE FROM public.movie_streams a USING public.movie_streams b
WHERE a.id > b.id AND a.movie_id = b.movie_id AND a.url = b.url;

-- Remove duplicate episode_streams keeping only the first one
DELETE FROM public.episode_streams a USING public.episode_streams b
WHERE a.id > b.id AND a.episode_id = b.episode_id AND a.url = b.url;

-- Now create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_movie_streams_unique_url ON public.movie_streams(movie_id, url);
CREATE UNIQUE INDEX IF NOT EXISTS idx_episode_streams_unique_url ON public.episode_streams(episode_id, url);

-- Add RLS for update on streams (needed for health checker)
ALTER POLICY "Service role can insert streams" ON public.movie_streams RENAME TO "Service role can manage movie streams";
DROP POLICY IF EXISTS "Service role can manage movie streams" ON public.movie_streams;
CREATE POLICY "Service role can manage streams" ON public.movie_streams FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can insert episode streams" ON public.episode_streams;
CREATE POLICY "Service role can manage episode streams" ON public.episode_streams FOR ALL USING (true) WITH CHECK (true);