
-- Bucket público para APK e screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('app_releases', 'app_releases', true)
ON CONFLICT (id) DO NOTHING;

-- Policies do bucket (qualquer um pode ler; só admin gerencia)
CREATE POLICY "Public can view app_releases"
ON storage.objects FOR SELECT
USING (bucket_id = 'app_releases');

CREATE POLICY "Admins can upload app_releases"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'app_releases' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update app_releases"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'app_releases' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete app_releases"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'app_releases' AND public.has_role(auth.uid(), 'admin'));

-- Tabela com metadata da versão atual do app (release "ativa")
CREATE TABLE public.app_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  apk_url text NOT NULL,
  changelog text,
  description text,
  size_mb numeric,
  min_android text DEFAULT '6.0',
  screenshots jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active releases"
ON public.app_releases FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage app_releases"
ON public.app_releases FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_app_releases_updated
BEFORE UPDATE ON public.app_releases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
