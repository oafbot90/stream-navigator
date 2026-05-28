
-- User coins balance table
CREATE TABLE public.user_coins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_coins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coins" ON public.user_coins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own coins" ON public.user_coins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own coins" ON public.user_coins FOR UPDATE USING (auth.uid() = user_id);

-- Coin transactions log
CREATE TABLE public.coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  type text NOT NULL CHECK (type IN ('mission', 'purchase', 'spend', 'refund')),
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.coin_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.coin_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Missions completed tracking
CREATE TABLE public.user_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_type text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  coins_earned integer NOT NULL DEFAULT 0
);

ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own missions" ON public.user_missions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own missions" ON public.user_missions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add playback sync columns to cinema_rooms
ALTER TABLE public.cinema_rooms 
  ADD COLUMN IF NOT EXISTS current_time_seconds numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_playing boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS synced_at timestamptz DEFAULT now();

-- Trigger for updated_at on user_coins
CREATE TRIGGER update_user_coins_updated_at
  BEFORE UPDATE ON public.user_coins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
