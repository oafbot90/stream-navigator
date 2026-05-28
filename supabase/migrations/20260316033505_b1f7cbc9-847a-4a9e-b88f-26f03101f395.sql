
-- Allow admins to manage hero_slider
CREATE POLICY "Admins can manage hero_slider"
ON public.hero_slider
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Make movies_catalog public (not just authenticated)
DROP POLICY "Authenticated read movies_catalog" ON public.movies_catalog;
CREATE POLICY "Public read movies_catalog"
ON public.movies_catalog
FOR SELECT
TO public
USING (true);

-- Add admin manage policy for movies_catalog
CREATE POLICY "Admins can manage movies_catalog"
ON public.movies_catalog
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Make series_catalog public
DROP POLICY "Authenticated read series_catalog" ON public.series_catalog;
CREATE POLICY "Public read series_catalog"
ON public.series_catalog
FOR SELECT
TO public
USING (true);

-- Add admin manage policy for series_catalog
CREATE POLICY "Admins can manage series_catalog"
ON public.series_catalog
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
