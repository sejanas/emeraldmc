-- Returning visitor detection: persistent cross-session browser ID
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS persistent_id text;
CREATE INDEX IF NOT EXISTS idx_visitors_persistent_id ON public.visitors (persistent_id) WHERE persistent_id IS NOT NULL;

-- Screen resolution tracking
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS screen_width smallint;
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS screen_height smallint;

-- Timeline annotations table for admins to mark events on trends chart
CREATE TABLE IF NOT EXISTS public.visitor_annotations (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  label      text        NOT NULL,
  date       date        NOT NULL,
  color      text        NOT NULL DEFAULT '#f59e0b',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.visitor_annotations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admin full access visitor_annotations" ON public.visitor_annotations;
CREATE POLICY "Allow admin full access visitor_annotations"
  ON public.visitor_annotations FOR ALL USING (true) WITH CHECK (true);

-- Supabase pg_cron: refresh materialized view every hour
-- NOTE: Enable pg_cron extension from Supabase Dashboard > Database > Extensions first
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'refresh-visitor-daily-stats',
      '0 * * * *',
      'REFRESH MATERIALIZED VIEW CONCURRENTLY public.visitor_daily_stats'
    );
  END IF;
END $$;
