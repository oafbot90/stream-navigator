
-- Series catalog table
CREATE TABLE public.series_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  original_title TEXT,
  tmdb_id INTEGER,
  imdb_id TEXT,
  overview TEXT,
  poster_path TEXT,
  backdrop_path TEXT,
  vote_average NUMERIC DEFAULT 0,
  vote_count INTEGER DEFAULT 0,
  first_air_date TEXT,
  last_air_date TEXT,
  release_year INTEGER,
  genres TEXT[] DEFAULT '{}',
  number_of_seasons INTEGER DEFAULT 0,
  number_of_episodes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'unknown',
  source TEXT NOT NULL DEFAULT 'custom',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.series_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view series catalog" ON public.series_catalog FOR SELECT USING (true);
CREATE POLICY "Service role can insert series" ON public.series_catalog FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update series" ON public.series_catalog FOR UPDATE USING (true);
CREATE POLICY "Service role can delete series" ON public.series_catalog FOR DELETE USING (true);

-- Series episodes table
CREATE TABLE public.series_episodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  series_id UUID NOT NULL REFERENCES public.series_catalog(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  season_number INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  overview TEXT,
  still_path TEXT,
  air_date TEXT,
  runtime INTEGER,
  tmdb_episode_id INTEGER,
  has_dub BOOLEAN DEFAULT false,
  has_leg BOOLEAN DEFAULT false,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.series_episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view episodes" ON public.series_episodes FOR SELECT USING (true);
CREATE POLICY "Service role can insert episodes" ON public.series_episodes FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update episodes" ON public.series_episodes FOR UPDATE USING (true);
CREATE POLICY "Service role can delete episodes" ON public.series_episodes FOR DELETE USING (true);

CREATE INDEX idx_episodes_series_id ON public.series_episodes(series_id);
CREATE INDEX idx_episodes_season_ep ON public.series_episodes(series_id, season_number, episode_number);

-- Episode streams table
CREATE TABLE public.episode_streams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_id UUID NOT NULL REFERENCES public.series_episodes(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  quality TEXT DEFAULT 'HD',
  stream_type TEXT DEFAULT 'direct',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.episode_streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view episode streams" ON public.episode_streams FOR SELECT USING (true);
CREATE POLICY "Service role can insert episode streams" ON public.episode_streams FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can delete episode streams" ON public.episode_streams FOR DELETE USING (true);

CREATE INDEX idx_episode_streams_episode_id ON public.episode_streams(episode_id);

-- Trigger for updated_at
CREATE TRIGGER update_series_catalog_updated_at
  BEFORE UPDATE ON public.series_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_series_episodes_updated_at
  BEFORE UPDATE ON public.series_episodes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
