-- Habilita busca insensível a acentos para filmes e séries
-- Rodar manualmente no SQL Editor do Supabase

create extension if not exists unaccent;
create extension if not exists pg_trgm;

-- Função imutável wrapper (necessária para usar em índices)
create or replace function public.f_unaccent(text)
returns text
language sql
immutable
parallel safe
as $$ select public.unaccent('public.unaccent', $1) $$;

-- Índices para acelerar buscas
create index if not exists idx_movies_catalog_title_unaccent
  on public.movies_catalog using gin (public.f_unaccent(lower(title)) public.gin_trgm_ops);

create index if not exists idx_movies_catalog_orig_unaccent
  on public.movies_catalog using gin (public.f_unaccent(lower(coalesce(original_title,''))) public.gin_trgm_ops);

create index if not exists idx_series_catalog_title_unaccent
  on public.series_catalog using gin (public.f_unaccent(lower(title)) public.gin_trgm_ops);

create index if not exists idx_series_catalog_orig_unaccent
  on public.series_catalog using gin (public.f_unaccent(lower(coalesce(original_name,''))) public.gin_trgm_ops);

-- RPC: busca filmes sem acento
create or replace function public.search_movies_unaccent(q text, lim int default 40)
returns setof public.movies_catalog
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.movies_catalog
  where public.f_unaccent(lower(coalesce(title,''))) like '%' || public.f_unaccent(lower(q)) || '%'
     or public.f_unaccent(lower(coalesce(original_title,''))) like '%' || public.f_unaccent(lower(q)) || '%'
  limit lim;
$$;

-- RPC: busca séries sem acento
create or replace function public.search_series_unaccent(q text, lim int default 40)
returns setof public.series_catalog
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.series_catalog
  where public.f_unaccent(lower(coalesce(title,''))) like '%' || public.f_unaccent(lower(q)) || '%'
     or public.f_unaccent(lower(coalesce(original_name,''))) like '%' || public.f_unaccent(lower(q)) || '%'
  limit lim;
$$;

grant execute on function public.search_movies_unaccent(text, int) to anon, authenticated, service_role;
grant execute on function public.search_series_unaccent(text, int) to anon, authenticated, service_role;
