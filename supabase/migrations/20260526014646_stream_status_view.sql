ALTER TABLE public.movies_catalog ADD COLUMN IF NOT EXISTS stream_status text NOT NULL DEFAULT 'no-links';
ALTER TABLE public.series_catalog ADD COLUMN IF NOT EXISTS stream_status text NOT NULL DEFAULT 'no-links';

CREATE INDEX IF NOT EXISTS movies_catalog_stream_status_idx ON public.movies_catalog (stream_status);
CREATE INDEX IF NOT EXISTS series_catalog_stream_status_idx ON public.series_catalog (stream_status);

CREATE OR REPLACE FUNCTION public.recompute_movie_stream_status(p_movie_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_total int; v_online int; v_new text;
BEGIN
  SELECT count(*), count(*) FILTER (WHERE status IN ('online','active'))
    INTO v_total, v_online FROM public.movie_streams WHERE movie_id = p_movie_id;
  IF v_total = 0 THEN v_new := 'no-links';
  ELSIF v_online > 0 THEN v_new := 'online';
  ELSE v_new := 'offline'; END IF;
  UPDATE public.movies_catalog SET stream_status = v_new
   WHERE id = p_movie_id AND stream_status IS DISTINCT FROM v_new;
END; $$;

CREATE OR REPLACE FUNCTION public.recompute_series_stream_status(p_series_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_total int; v_online int; v_new text;
BEGIN
  SELECT count(es.*), count(es.*) FILTER (WHERE es.status IN ('online','active'))
    INTO v_total, v_online
    FROM public.episode_streams es
    JOIN public.series_episodes ep ON ep.id = es.episode_id
    WHERE ep.series_id = p_series_id;
  IF v_total = 0 THEN v_new := 'no-links';
  ELSIF v_online > 0 THEN v_new := 'online';
  ELSE v_new := 'offline'; END IF;
  UPDATE public.series_catalog SET stream_status = v_new
   WHERE id = p_series_id AND stream_status IS DISTINCT FROM v_new;
END; $$;

CREATE OR REPLACE FUNCTION public.trg_movie_streams_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_movie_stream_status(OLD.movie_id);
    RETURN OLD;
  END IF;
  PERFORM public.recompute_movie_stream_status(NEW.movie_id);
  IF TG_OP = 'UPDATE' AND OLD.movie_id IS DISTINCT FROM NEW.movie_id THEN
    PERFORM public.recompute_movie_stream_status(OLD.movie_id);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS movie_streams_status_trg ON public.movie_streams;
CREATE TRIGGER movie_streams_status_trg
AFTER INSERT OR UPDATE OR DELETE ON public.movie_streams
FOR EACH ROW EXECUTE FUNCTION public.trg_movie_streams_status();

CREATE OR REPLACE FUNCTION public.trg_episode_streams_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_series uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT series_id INTO v_series FROM public.series_episodes WHERE id = OLD.episode_id;
    IF v_series IS NOT NULL THEN PERFORM public.recompute_series_stream_status(v_series); END IF;
    RETURN OLD;
  END IF;
  SELECT series_id INTO v_series FROM public.series_episodes WHERE id = NEW.episode_id;
  IF v_series IS NOT NULL THEN PERFORM public.recompute_series_stream_status(v_series); END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS episode_streams_status_trg ON public.episode_streams;
CREATE TRIGGER episode_streams_status_trg
AFTER INSERT OR UPDATE OR DELETE ON public.episode_streams
FOR EACH ROW EXECUTE FUNCTION public.trg_episode_streams_status();

UPDATE public.movies_catalog m SET stream_status = sub.s
FROM (
  SELECT m.id, CASE
    WHEN count(ms.*) = 0 THEN 'no-links'
    WHEN count(ms.*) FILTER (WHERE ms.status IN ('online','active')) > 0 THEN 'online'
    ELSE 'offline' END AS s
  FROM public.movies_catalog m
  LEFT JOIN public.movie_streams ms ON ms.movie_id = m.id
  GROUP BY m.id
) sub WHERE m.id = sub.id AND m.stream_status IS DISTINCT FROM sub.s;

UPDATE public.series_catalog s SET stream_status = sub.st
FROM (
  SELECT s.id, CASE
    WHEN count(es.*) = 0 THEN 'no-links'
    WHEN count(es.*) FILTER (WHERE es.status IN ('online','active')) > 0 THEN 'online'
    ELSE 'offline' END AS st
  FROM public.series_catalog s
  LEFT JOIN public.series_episodes ep ON ep.series_id = s.id
  LEFT JOIN public.episode_streams es ON es.episode_id = ep.id
  GROUP BY s.id
) sub WHERE s.id = sub.id AND s.stream_status IS DISTINCT FROM sub.st;

CREATE OR REPLACE VIEW public.stream_status_view AS
SELECT m.id, m.title, m.poster_path, 'movie'::text AS type,
       ('/admin/edit-movie/' || m.id::text) AS edit_link,
       m.stream_status AS status
FROM public.movies_catalog m
UNION ALL
SELECT s.id, s.title, s.poster_path, 'series'::text AS type,
       ('/admin/edit-series/' || s.id::text) AS edit_link,
       s.stream_status AS status
FROM public.series_catalog s;

GRANT SELECT ON public.stream_status_view TO anon, authenticated;
