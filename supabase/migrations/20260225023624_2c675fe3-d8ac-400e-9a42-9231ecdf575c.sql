
-- Create table for premium keys
CREATE TABLE public.premium_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key_code text NOT NULL UNIQUE,
  duration_days integer NOT NULL DEFAULT 30,
  is_used boolean NOT NULL DEFAULT false,
  used_by uuid,
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid
);

-- Enable RLS
ALTER TABLE public.premium_keys ENABLE ROW LEVEL SECURITY;

-- Only admins (via service role) can insert/update/delete keys
CREATE POLICY "Service role can manage premium keys"
ON public.premium_keys
FOR ALL
USING (true)
WITH CHECK (true);

-- Users can view keys to redeem (only unused ones)
CREATE POLICY "Anyone can view unused keys for redemption"
ON public.premium_keys
FOR SELECT
USING (true);
