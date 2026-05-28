-- Run this manually in Supabase SQL editor.
-- Creates a view listing every movie and every episode that has NO stream link.

CREATE OR REPLACE VIEW public.items_without_streams AS
SELECT
  m.id                                       AS id,
  m.title                                    AS title,
  m.poster_path                              AS poster_path,
  'movie'::text                              AS type,
  ('/admin/edit-movie/' || m.id::text)       AS edit_link,
  'no-links'::text                           AS status
FROM public.movies_catalog m
WHERE NOT EXISTS (
  SELECT 1 FROM public.movie_streams ms WHERE ms.movie_id = m.id
)
UNION ALL
SELECT
  ep.id                                      AS id,
  (s.title || ' — S'
    || lpad(ep.season_number::text, 2, '0')
    || 'E' || lpad(ep.episode_number::text, 2, '0')
    || COALESCE(' · ' || NULLIF(ep.title, ''), '')) AS title,
  s.poster_path                              AS poster_path,
  'series'::text                             AS type,
  ('/admin/edit-series/' || s.id::text)      AS edit_link,
  'no-links'::text                           AS status
FROM public.series_episodes ep
JOIN public.series_catalog s ON s.id = ep.series_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.episode_streams es WHERE es.episode_id = ep.id
);

GRANT SELECT ON public.items_without_streams TO anon, authenticated;
