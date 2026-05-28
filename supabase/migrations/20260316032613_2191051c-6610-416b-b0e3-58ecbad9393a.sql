
CREATE POLICY "Admins can manage app_avatars"
ON public.app_avatars
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
