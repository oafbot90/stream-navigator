ALTER TABLE public.profile_backgrounds 
ADD COLUMN IF NOT EXISTS orientation text NOT NULL DEFAULT 'horizontal' 
CHECK (orientation IN ('horizontal', 'vertical'));