-- Release calendar table for manual upcoming releases (movies, series, animes, events)
CREATE TABLE IF NOT EXISTS public.release_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  poster_url text,
  backdrop_url text,
  release_date date NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('movie','tv','anime','event')),
  tmdb_id bigint,
  season_number integer,
  episode_number integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.release_calendar ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.release_calendar ADD COLUMN IF NOT EXISTS poster_url text;
ALTER TABLE public.release_calendar ADD COLUMN IF NOT EXISTS backdrop_url text;
ALTER TABLE public.release_calendar ADD COLUMN IF NOT EXISTS tmdb_id bigint;
ALTER TABLE public.release_calendar ADD COLUMN IF NOT EXISTS season_number integer;
ALTER TABLE public.release_calendar ADD COLUMN IF NOT EXISTS episode_number integer;

CREATE INDEX IF NOT EXISTS release_calendar_date_idx ON public.release_calendar (release_date);
CREATE INDEX IF NOT EXISTS release_calendar_type_idx ON public.release_calendar (content_type);

ALTER TABLE public.release_calendar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "release_calendar_read_all" ON public.release_calendar;
CREATE POLICY "release_calendar_read_all"
  ON public.release_calendar FOR SELECT USING (true);

DROP POLICY IF EXISTS "release_calendar_admin_insert" ON public.release_calendar;
CREATE POLICY "release_calendar_admin_insert"
  ON public.release_calendar FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'email') IN ('alezin1299@gmail.com','alezin1788@gmail.com'));

DROP POLICY IF EXISTS "release_calendar_admin_update" ON public.release_calendar;
CREATE POLICY "release_calendar_admin_update"
  ON public.release_calendar FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'email') IN ('alezin1299@gmail.com','alezin1788@gmail.com'))
  WITH CHECK ((auth.jwt() ->> 'email') IN ('alezin1299@gmail.com','alezin1788@gmail.com'));

DROP POLICY IF EXISTS "release_calendar_admin_delete" ON public.release_calendar;
CREATE POLICY "release_calendar_admin_delete"
  ON public.release_calendar FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'email') IN ('alezin1299@gmail.com','alezin1788@gmail.com'));
