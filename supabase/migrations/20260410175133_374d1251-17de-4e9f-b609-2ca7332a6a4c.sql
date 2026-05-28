
-- Profile decorations table
CREATE TABLE public.profile_decorations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'frame', -- frame, badge, effect
  url TEXT NOT NULL,
  is_animated BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_decorations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read profile_decorations"
  ON public.profile_decorations FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage profile_decorations"
  ON public.profile_decorations FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Profile banners table
CREATE TABLE public.profile_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  is_animated BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read profile_banners"
  ON public.profile_banners FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage profile_banners"
  ON public.profile_banners FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add decoration and banner columns to user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN decoration_id UUID REFERENCES public.profile_decorations(id) ON DELETE SET NULL,
  ADD COLUMN banner_id UUID REFERENCES public.profile_banners(id) ON DELETE SET NULL;
