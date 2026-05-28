
-- Drop the authenticated-only SELECT policy on hero_slider
DROP POLICY IF EXISTS "Authenticated read hero_slider" ON public.hero_slider;

-- Create a public read policy
CREATE POLICY "Public read hero_slider"
  ON public.hero_slider
  FOR SELECT
  TO public
  USING (true);
