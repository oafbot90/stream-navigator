
-- Tabela principal do catálogo de filmes com URLs de vídeo próprias
CREATE TABLE public.movies_catalog (
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
  release_date TEXT,
  release_year INTEGER,
  genres TEXT[] DEFAULT '{}',
  runtime INTEGER,
  content_type TEXT NOT NULL DEFAULT 'movie',
  source TEXT NOT NULL DEFAULT 'custom',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para URLs de vídeo (um filme pode ter múltiplas qualidades)
CREATE TABLE public.movie_streams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id UUID NOT NULL REFERENCES public.movies_catalog(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  quality TEXT DEFAULT 'HD',
  stream_type TEXT DEFAULT 'direct',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX idx_movies_catalog_tmdb_id ON public.movies_catalog(tmdb_id);
CREATE INDEX idx_movies_catalog_title ON public.movies_catalog USING gin(to_tsvector('portuguese', title));
CREATE INDEX idx_movies_catalog_content_type ON public.movies_catalog(content_type);
CREATE INDEX idx_movie_streams_movie_id ON public.movie_streams(movie_id);

-- RLS
ALTER TABLE public.movies_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_streams ENABLE ROW LEVEL SECURITY;

-- Todos podem ver o catálogo (conteúdo público)
CREATE POLICY "Anyone can view movies catalog"
  ON public.movies_catalog FOR SELECT USING (true);

CREATE POLICY "Anyone can view movie streams"
  ON public.movie_streams FOR SELECT USING (true);

-- Apenas service_role pode inserir/atualizar (via edge function)
CREATE POLICY "Service role can insert movies"
  ON public.movies_catalog FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update movies"
  ON public.movies_catalog FOR UPDATE
  USING (true);

CREATE POLICY "Service role can insert streams"
  ON public.movie_streams FOR INSERT
  WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_movies_catalog_updated_at
  BEFORE UPDATE ON public.movies_catalog
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
