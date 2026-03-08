-- ============================================================
-- Admin RLS policies
--
-- All database write operations flow through the API edge function
-- using SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS entirely.
-- These policies enforce the intended access model for any direct
-- authenticated connections (e.g. Supabase Studio, support tooling).
-- ============================================================

-- ── user_profiles ──────────────────────────────────────────

-- Admins (including super_admin, who also have user_roles.role = 'admin')
-- can read all user profiles for the approval/management workflow.
CREATE POLICY "admins_read_all_profiles"
  ON public.user_profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Admins can update profiles (approve, revoke, promote).
CREATE POLICY "admins_update_profiles"
  ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ── activity_logs ───────────────────────────────────────────

-- Admins can read all activity logs (super_admin sees all via the API;
-- this policy enables the same through direct connections).
CREATE POLICY "admins_read_all_logs"
  ON public.activity_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ── bookings ────────────────────────────────────────────────

-- Public users can only INSERT new bookings (already set); admins can
-- DELETE cancelled bookings if needed (soft-deletes preferred via API).
CREATE POLICY "admins_delete_bookings"
  ON public.bookings
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
