
ALTER TABLE public.app_avatars ADD COLUMN is_premium boolean NOT NULL DEFAULT false;
ALTER TABLE public.profile_banners ADD COLUMN is_premium boolean NOT NULL DEFAULT false;
ALTER TABLE public.profile_decorations ADD COLUMN is_premium boolean NOT NULL DEFAULT false;
