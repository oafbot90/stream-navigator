-- Add unique constraint on category name for upsert support  
DO $$ BEGIN
  ALTER TABLE public.livetv_categories ADD CONSTRAINT livetv_categories_name_key UNIQUE (name);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;