-- Add privacy and payment columns to cinema_rooms
ALTER TABLE public.cinema_rooms 
  ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS room_password text DEFAULT null,
  ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS entry_cost integer DEFAULT 0;

-- Add unique constraint for room members (needed for upsert)
ALTER TABLE public.cinema_room_members 
  ADD CONSTRAINT cinema_room_members_room_user_unique UNIQUE (room_id, user_id);

-- Add muted_users array to cinema_rooms for host mute feature
ALTER TABLE public.cinema_rooms
  ADD COLUMN IF NOT EXISTS muted_users uuid[] DEFAULT '{}';

-- Add daily room creation limit tracking
CREATE TABLE IF NOT EXISTS public.daily_room_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_date date NOT NULL DEFAULT CURRENT_DATE,
  rooms_created integer NOT NULL DEFAULT 1,
  UNIQUE(user_id, created_date)
);

ALTER TABLE public.daily_room_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own limits" ON public.daily_room_limits
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own limits" ON public.daily_room_limits
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own limits" ON public.daily_room_limits
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Add new mission types tracking columns
ALTER TABLE public.user_missions
  ADD COLUMN IF NOT EXISTS progress integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS target integer DEFAULT 1;