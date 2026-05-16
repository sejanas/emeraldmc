-- Announcement lifecycle revamp:
-- Adds explicit `published_at` and `paused_at` markers so the UI can derive
-- Draft / Scheduled / Live / Paused / Expired / Archived status without an enum
-- column. `deleted_at` (already present) remains the single source of truth for
-- soft-delete (Archived). No hard delete: rows are never physically removed by
-- the app or the auto-archive job.

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS paused_at    timestamptz;

-- Backfill: any row that was already active is treated as previously published,
-- so it doesn't get reclassified as Draft after this migration runs.
UPDATE public.announcements
   SET published_at = COALESCE(published_at, start_at, created_at)
 WHERE is_active = true
   AND published_at IS NULL;

-- Cleanup: the original soft-delete handler (edge function `handleAnnouncementDelete`)
-- also forced `is_active = false` on archive. With the new lifecycle, Archived is
-- its own state; any historical rows in that contradictory configuration are fine
-- as long as `deleted_at IS NOT NULL` continues to mean Archived.

CREATE INDEX IF NOT EXISTS idx_announcements_published_at
  ON public.announcements (published_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_announcements_paused_at
  ON public.announcements (paused_at)
  WHERE deleted_at IS NULL;

-- Auto-archive helper: callable from a cron job or manually. Soft-archives any
-- live row whose end_at is more than 30 days in the past. Never hard-deletes.
CREATE OR REPLACE FUNCTION public.auto_archive_expired_announcements(
  retention_days integer DEFAULT 30
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE public.announcements
     SET deleted_at = now()
   WHERE deleted_at IS NULL
     AND end_at IS NOT NULL
     AND end_at < (now() - make_interval(days => retention_days));
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

REVOKE ALL ON FUNCTION public.auto_archive_expired_announcements(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auto_archive_expired_announcements(integer) TO service_role;

-- Schedule the daily auto-archive job if pg_cron is available. If pg_cron isn't
-- enabled in this project, the function above can still be invoked manually.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Drop any prior schedule so re-running this migration is idempotent.
    PERFORM cron.unschedule(jobid)
      FROM cron.job
     WHERE jobname = 'auto-archive-expired-announcements';

    PERFORM cron.schedule(
      'auto-archive-expired-announcements',
      '0 3 * * *',
      $cron$ SELECT public.auto_archive_expired_announcements(30) $cron$
    );
  END IF;
END $$;
