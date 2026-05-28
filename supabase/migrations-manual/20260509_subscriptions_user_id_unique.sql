-- Migration: unique index on subscriptions.user_id for upsert support
-- Required for orionpay edge functions to use upsert with onConflict: 'user_id'
-- Run this in your Supabase SQL Editor (this project uses an external Supabase instance)

create unique index if not exists idx_subscriptions_user_id_unique
  on public.subscriptions (user_id);
