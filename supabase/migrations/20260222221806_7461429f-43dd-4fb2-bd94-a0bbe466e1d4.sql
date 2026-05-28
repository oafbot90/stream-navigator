-- Allow service role to delete streams and movies
CREATE POLICY "Service role can delete streams" ON public.movie_streams FOR DELETE USING (true);
CREATE POLICY "Service role can delete movies" ON public.movies_catalog FOR DELETE USING (true);

-- Truncate both tables (streams first due to FK)
TRUNCATE TABLE public.movie_streams CASCADE;
TRUNCATE TABLE public.movies_catalog CASCADE;