-- Create profile_backgrounds table for admin-managed background images
CREATE TABLE public.profile_backgrounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_backgrounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read profile_backgrounds"
ON public.profile_backgrounds
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage profile_backgrounds"
ON public.profile_backgrounds
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_profile_backgrounds_updated_at
BEFORE UPDATE ON public.profile_backgrounds
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();