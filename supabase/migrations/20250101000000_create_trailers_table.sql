
-- Create trailers table
CREATE TABLE IF NOT EXISTS public.trailers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id INTEGER NOT NULL,
  source VARCHAR(20) NOT NULL DEFAULT 'tmdb',
  type VARCHAR(20) NOT NULL, -- 'movie' | 'tv' | 'anime'
  title_pt TEXT NOT NULL,
  title_original TEXT NOT NULL,
  overview TEXT,
  genres TEXT[],
  poster_url TEXT,
  backdrop_url TEXT,
  youtube_key TEXT NOT NULL,
  vertical_url TEXT, -- URL do vídeo vertical processado
  language VARCHAR(10) DEFAULT 'pt-BR',
  trailer_type VARCHAR(20) DEFAULT 'Trailer', -- 'Trailer' | 'Teaser' | 'Clip'
  release_year INTEGER,
  runtime INTEGER,
  rating DECIMAL(3,1),
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trailers_type ON public.trailers(type);
CREATE INDEX IF NOT EXISTS idx_trailers_created_at ON public.trailers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trailers_likes ON public.trailers(likes_count DESC);

-- Create trailer_likes table for user interactions
CREATE TABLE IF NOT EXISTS public.trailer_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trailer_id UUID NOT NULL REFERENCES public.trailers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trailer_id, user_id, profile_id)
);

-- Create indexes for trailer_likes
CREATE INDEX IF NOT EXISTS idx_trailer_likes_user ON public.trailer_likes(user_id, profile_id);
CREATE INDEX IF NOT EXISTS idx_trailer_likes_trailer ON public.trailer_likes(trailer_id);

-- Enable RLS
ALTER TABLE public.trailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trailer_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trailers (everyone can read, only system can write)
CREATE POLICY "Anyone can view trailers" ON public.trailers
  FOR SELECT USING (true);

-- RLS Policies for trailer_likes
CREATE POLICY "Users can view their own likes" ON public.trailer_likes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own likes" ON public.trailer_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON public.trailer_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update likes count
CREATE OR REPLACE FUNCTION update_trailer_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.trailers 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.trailer_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.trailers 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.trailer_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update likes count
CREATE TRIGGER trailer_likes_count_trigger
  AFTER INSERT OR DELETE ON public.trailer_likes
  FOR EACH ROW EXECUTE FUNCTION update_trailer_likes_count();
