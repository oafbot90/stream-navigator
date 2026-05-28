
-- Table to store admin-curated hero slider movies
CREATE TABLE public.hero_slider (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id UUID NOT NULL REFERENCES public.movies_catalog(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(movie_id)
);

-- Enable RLS
ALTER TABLE public.hero_slider ENABLE ROW LEVEL SECURITY;

-- Everyone can read active slider items
CREATE POLICY "Anyone can view hero slider" 
ON public.hero_slider 
FOR SELECT 
USING (true);

-- Only authenticated users can manage (admin check done in app)
CREATE POLICY "Authenticated users can insert hero slider" 
ON public.hero_slider 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update hero slider" 
ON public.hero_slider 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete hero slider" 
ON public.hero_slider 
FOR DELETE 
USING (auth.uid() IS NOT NULL);
