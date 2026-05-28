
-- Cinema rooms table
CREATE TABLE public.cinema_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  total_seats integer NOT NULL DEFAULT 10,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id text,
  content_type text,
  content_title text,
  content_poster text,
  status text NOT NULL DEFAULT 'waiting',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cinema_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view cinema rooms" ON public.cinema_rooms
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert cinema rooms" ON public.cinema_rooms
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator can update cinema rooms" ON public.cinema_rooms
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Creator can delete cinema rooms" ON public.cinema_rooms
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Cinema room members
CREATE TABLE public.cinema_room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.cinema_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_name text NOT NULL DEFAULT 'Anônimo',
  avatar_url text,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

ALTER TABLE public.cinema_room_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view members" ON public.cinema_room_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can join rooms" ON public.cinema_room_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms" ON public.cinema_room_members
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Cinema chat messages
CREATE TABLE public.cinema_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.cinema_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_name text NOT NULL DEFAULT 'Anônimo',
  avatar_url text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cinema_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view chat" ON public.cinema_chat_messages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can send messages" ON public.cinema_chat_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
