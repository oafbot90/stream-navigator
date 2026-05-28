DO $$
BEGIN
  -- If the proper UNIQUE constraint already exists, nothing to do
  IF EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'movies_catalog'
      AND c.conname = 'movies_catalog_tmdb_id_unique'
      AND c.contype = 'u'
  ) THEN
    RETURN;
  END IF;

  -- If a plain index with the same name exists, drop it first
  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'movies_catalog'
      AND indexname = 'movies_catalog_tmdb_id_unique'
  ) THEN
    EXECUTE 'DROP INDEX public.movies_catalog_tmdb_id_unique';
  END IF;

  -- Create real UNIQUE constraint (allows multiple NULLs by default in Postgres)
  ALTER TABLE public.movies_catalog
    ADD CONSTRAINT movies_catalog_tmdb_id_unique UNIQUE (tmdb_id);
END
$$;