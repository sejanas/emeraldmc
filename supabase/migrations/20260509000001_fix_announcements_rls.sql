-- Tighten RLS: remove permissive policies that effectively granted full table access
-- to the anon/authenticated roles (FOR ALL USING (true) OR'd with public SELECT).
-- Admin writes continue via the edge function (service role bypasses RLS).
-- Public reads remain via announcements_public_select only.

DROP POLICY IF EXISTS "announcements_admin_all" ON public.announcements;

-- Events are written only by the edge function (service role). Drop open INSERT so
-- PostgREST clients cannot spam the table directly.
DROP POLICY IF EXISTS "announcement_events_insert" ON public.announcement_events;
