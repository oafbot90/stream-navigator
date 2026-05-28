DROP POLICY IF EXISTS "Service role can insert episodes" ON public.series_episodes;
DROP POLICY IF EXISTS "Service role can update episodes" ON public.series_episodes;
DROP POLICY IF EXISTS "Service role can delete episodes" ON public.series_episodes;
DROP POLICY IF EXISTS "Admins can manage series episodes" ON public.series_episodes;

CREATE POLICY "Admins can manage series episodes"
ON public.series_episodes
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (auth.jwt() ->> 'email') IN ('alezin1299@gmail.com','alezin1788@gmail.com')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (auth.jwt() ->> 'email') IN ('alezin1299@gmail.com','alezin1788@gmail.com')
);

DROP POLICY IF EXISTS "Service role can insert episode streams" ON public.episode_streams;
DROP POLICY IF EXISTS "Service role can delete episode streams" ON public.episode_streams;
DROP POLICY IF EXISTS "Service role can manage episode streams" ON public.episode_streams;
DROP POLICY IF EXISTS "Admins can manage episode streams" ON public.episode_streams;

CREATE POLICY "Admins can manage episode streams"
ON public.episode_streams
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (auth.jwt() ->> 'email') IN ('alezin1299@gmail.com','alezin1788@gmail.com')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (auth.jwt() ->> 'email') IN ('alezin1299@gmail.com','alezin1788@gmail.com')
);
