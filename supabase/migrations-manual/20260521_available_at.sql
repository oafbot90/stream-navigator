-- Scheduled availability for movies and series
ALTER TABLE public.movies_catalog ADD COLUMN IF NOT EXISTS available_at timestamptz;
ALTER TABLE public.series_catalog ADD COLUMN IF NOT EXISTS available_at timestamptz;

CREATE INDEX IF NOT EXISTS movies_catalog_available_at_idx ON public.movies_catalog (available_at);
CREATE INDEX IF NOT EXISTS series_catalog_available_at_idx ON public.series_catalog (available_at);
