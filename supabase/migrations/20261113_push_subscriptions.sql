-- Migration: Web Push Subscriptions for Hybrid Notification System
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT,
  auth TEXT,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'guest',
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_school_id
  ON public.push_subscriptions (school_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Allow public insert push_subscriptions"
  ON public.push_subscriptions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Allow public update push_subscriptions"
  ON public.push_subscriptions
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Allow public select push_subscriptions"
  ON public.push_subscriptions
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow public delete push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Allow public delete push_subscriptions"
  ON public.push_subscriptions
  FOR DELETE
  TO anon, authenticated
  USING (true);

