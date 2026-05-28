
-- Create categories table for live TV
CREATE TABLE public.livetv_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.livetv_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view livetv categories" ON public.livetv_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage livetv categories" ON public.livetv_categories
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create channels table for live TV
CREATE TABLE public.livetv_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  logo TEXT DEFAULT '',
  stream_url TEXT NOT NULL,
  format TEXT DEFAULT 'm3u8',
  status TEXT DEFAULT 'online',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.livetv_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view livetv channels" ON public.livetv_channels
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage livetv channels" ON public.livetv_channels
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert categories
INSERT INTO public.livetv_categories (name) VALUES
  ('Todos'), ('Abertos'), ('Comedia'), ('Documentarios'), ('Esportes'),
  ('Filmes'), ('Infantil'), ('Musica'), ('Noticias'), ('Series'), ('Variedades');

-- Insert channels
INSERT INTO public.livetv_channels (name, slug, category, stream_url, status) VALUES
  ('Band', 'band', 'Abertos', 'https://canais.fazoeli.co.za/fontes/smart/band.m3u8', 'online'),
  ('Globo', 'globo', 'Abertos', 'https://canais.fazoeli.co.za/fontes/smart/globo.m3u8', 'offline'),
  ('Record', 'record', 'Abertos', 'https://canais.fazoeli.co.za/fontes/smart/record.m3u8', 'online'),
  ('RedeTV', 'redetv', 'Abertos', 'https://canais.fazoeli.co.za/fontes/smart/redetv.m3u8', 'online'),
  ('SBT', 'sbt', 'Abertos', 'https://canais.fazoeli.co.za/fontes/smart/sbt.m3u8', 'online'),
  ('Comedy Central', 'comedycentral', 'Comedia', 'https://canais.fazoeli.co.za/fontes/smart/comedycentral.m3u8', 'online'),
  ('Animal Planet', 'animalplanet', 'Documentarios', 'https://canais.fazoeli.co.za/fontes/smart/animalplanet.m3u8', 'online'),
  ('Discovery Channel', 'discoverychannel', 'Documentarios', 'https://canais.fazoeli.co.za/fontes/smart/discoverychannel.m3u8', 'online'),
  ('History Channel', 'history', 'Documentarios', 'https://canais.fazoeli.co.za/fontes/smart/history.m3u8', 'online'),
  ('National Geographic', 'natgeo', 'Documentarios', 'https://canais.fazoeli.co.za/fontes/smart/natgeo.m3u8', 'offline'),
  ('ESPN', 'espn', 'Esportes', 'https://canais.fazoeli.co.za/fontes/smart/espn.m3u8', 'online'),
  ('ESPN 2', 'espn2', 'Esportes', 'https://canais.fazoeli.co.za/fontes/smart/espn2.m3u8', 'online'),
  ('ESPN 3', 'espn3', 'Esportes', 'https://canais.fazoeli.co.za/fontes/smart/espn3.m3u8', 'online'),
  ('ESPN 4', 'espn4', 'Esportes', 'https://canais.fazoeli.co.za/fontes/smart/espn4.m3u8', 'online'),
  ('SporTV', 'sportv', 'Esportes', 'https://canais.fazoeli.co.za/fontes/smart/sportv.m3u8', 'online'),
  ('SporTV 2', 'sportv2', 'Esportes', 'https://canais.fazoeli.co.za/fontes/smart/sportv2.m3u8', 'online'),
  ('SporTV 3', 'sportv3', 'Esportes', 'https://canais.fazoeli.co.za/fontes/smart/sportv3.m3u8', 'online'),
  ('HBO', 'hbo', 'Filmes', 'https://canais.fazoeli.co.za/fontes/smart/hbo.m3u8', 'online'),
  ('HBO 2', 'hbo2', 'Filmes', 'https://canais.fazoeli.co.za/fontes/smart/hbo2.m3u8', 'online'),
  ('HBO Family', 'hbofamily', 'Filmes', 'https://canais.fazoeli.co.za/fontes/smart/hbofamily.m3u8', 'online'),
  ('HBO Plus', 'hboplus', 'Filmes', 'https://canais.fazoeli.co.za/fontes/smart/hboplus.m3u8', 'online'),
  ('HBO Signature', 'hbosignature', 'Filmes', 'https://canais.fazoeli.co.za/fontes/smart/hbosignature.m3u8', 'offline'),
  ('Space', 'space', 'Filmes', 'https://canais.fazoeli.co.za/fontes/smart/space.m3u8', 'online'),
  ('Telecine Action', 'telecineaction', 'Filmes', 'https://canais.fazoeli.co.za/fontes/smart/telecineaction.m3u8', 'online'),
  ('Telecine Fun', 'telecinefun', 'Filmes', 'https://canais.fazoeli.co.za/fontes/smart/telecinefun.m3u8', 'online'),
  ('Telecine Pipoca', 'telecinepipoca', 'Filmes', 'https://canais.fazoeli.co.za/fontes/smart/telecinepipoca.m3u8', 'online'),
  ('Telecine Premium', 'telecinepremium', 'Filmes', 'https://canais.fazoeli.co.za/fontes/smart/telecinepremium.m3u8', 'online'),
  ('Telecine Touch', 'telecinetouch', 'Filmes', 'https://canais.fazoeli.co.za/fontes/smart/telecinetouch.m3u8', 'online'),
  ('Cartoon Network', 'cartoonnetwork', 'Infantil', 'https://canais.fazoeli.co.za/fontes/smart/cartoonnetwork.m3u8', 'online'),
  ('Discovery Kids', 'discoverykids', 'Infantil', 'https://canais.fazoeli.co.za/fontes/smart/discoverykids.m3u8', 'online'),
  ('Disney Channel', 'disneychannel', 'Infantil', 'https://canais.fazoeli.co.za/fontes/smart/disneychannel.m3u8', 'offline'),
  ('Nickelodeon', 'nickelodeon', 'Infantil', 'https://canais.fazoeli.co.za/fontes/smart/nickelodeon.m3u8', 'online'),
  ('Bis', 'bis', 'Musica', 'https://canais.fazoeli.co.za/fontes/smart/bis.m3u8', 'online'),
  ('MTV', 'mtv', 'Musica', 'https://canais.fazoeli.co.za/fontes/smart/mtv.m3u8', 'online'),
  ('Band News', 'bandnews', 'Noticias', 'https://canais.fazoeli.co.za/fontes/smart/bandnews.m3u8', 'online'),
  ('CNN Brasil', 'cnnbrasil', 'Noticias', 'https://canais.fazoeli.co.za/fontes/smart/cnnbrasil.m3u8', 'online'),
  ('GloboNews', 'globonews', 'Noticias', 'https://canais.fazoeli.co.za/fontes/smart/globonews.m3u8', 'online'),
  ('Record News', 'recordnews', 'Noticias', 'https://canais.fazoeli.co.za/fontes/smart/recordnews.m3u8', 'online'),
  ('AXN', 'axn', 'Series', 'https://canais.fazoeli.co.za/fontes/smart/axn.m3u8', 'online'),
  ('FX', 'fx', 'Series', 'https://canais.fazoeli.co.za/fontes/smart/fx.m3u8', 'offline'),
  ('Syfy', 'syfy', 'Series', 'https://canais.fazoeli.co.za/fontes/smart/syfy.m3u8', 'offline'),
  ('TNT', 'tnt', 'Series', 'https://canais.fazoeli.co.za/fontes/smart/tnt.m3u8', 'online'),
  ('Universal Channel', 'universal', 'Series', 'https://canais.fazoeli.co.za/fontes/smart/universal.m3u8', 'offline'),
  ('Warner Channel', 'warner', 'Series', 'https://canais.fazoeli.co.za/fontes/smart/warner.m3u8', 'offline'),
  ('E! Entertainment', 'eentertainment', 'Variedades', 'https://canais.fazoeli.co.za/fontes/smart/eentertainment.m3u8', 'offline'),
  ('GNT', 'gnt', 'Variedades', 'https://canais.fazoeli.co.za/fontes/smart/gnt.m3u8', 'online'),
  ('Multishow', 'multishow', 'Variedades', 'https://canais.fazoeli.co.za/fontes/smart/multishow.m3u8', 'online'),
  ('Viva', 'viva', 'Variedades', 'https://canais.fazoeli.co.za/fontes/smart/viva.m3u8', 'online');
