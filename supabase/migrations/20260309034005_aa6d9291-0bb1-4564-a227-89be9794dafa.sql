
-- Avatars table for persisting avatar data
CREATE TABLE public.app_avatars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT 'from-gray-400 to-gray-600',
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.app_avatars ENABLE ROW LEVEL SECURITY;

-- Anyone can view avatars
CREATE POLICY "Anyone can view avatars" ON public.app_avatars FOR SELECT USING (true);

-- Only admins can manage avatars
CREATE POLICY "Admins can manage avatars" ON public.app_avatars FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Content reports table
CREATE TABLE public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text,
  content_id text NOT NULL,
  content_type text NOT NULL,
  content_title text NOT NULL,
  report_type text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

-- Users can insert their own reports
CREATE POLICY "Users can insert own reports" ON public.content_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can view their own reports
CREATE POLICY "Users can view own reports" ON public.content_reports FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage all reports
CREATE POLICY "Admins can manage reports" ON public.content_reports FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default avatars
INSERT INTO public.app_avatars (url, name, color, position) VALUES
  ('https://i.ibb.co/272GtBGq/185956f7-318e-4f8c-8779-eaf6a15bd4ca.png', 'Flix', 'from-red-500 to-red-700', 0),
  ('https://wallpapers.com/images/hd/netflix-profile-pictures-1000-x-1000-qo9h82134t9nv0j0.jpg', 'Clássico', 'from-orange-500 to-red-600', 1),
  ('https://wallpapers.com/images/hd/netflix-profile-pictures-5yup5hd2i60x7ew3.jpg', 'Amarelo', 'from-yellow-400 to-orange-500', 2),
  ('https://mir-s3-cdn-cf.behance.net/project_modules/disp/366be133850498.56ba69ac36858.png', 'Verde', 'from-green-400 to-emerald-600', 3),
  ('https://wallpapers.com/images/hd/netflix-profile-pictures-1000-x-1000-88wkdmjrorckekha.jpg', 'Azul', 'from-blue-400 to-blue-600', 4),
  ('https://66.media.tumblr.com/6cfad7b0f3f24fce553314ce521453e3/tumblr_psapldQm9w1wxrxy2_540.png', 'Lucifer', 'from-gray-700 to-gray-900', 5),
  ('https://i.imgur.com/9nWtdiZ.png', 'Pepino', 'from-green-400 to-lime-500', 6),
  ('https://i.imgur.com/APYSZGK.png', 'Roxo', 'from-purple-400 to-purple-600', 7),
  ('https://i.imgur.com/3ZtRl1h.png', 'Dourado', 'from-yellow-400 to-amber-600', 8),
  ('https://i.imgur.com/Kkaeq84.png', 'Violeta', 'from-violet-400 to-purple-600', 9);
