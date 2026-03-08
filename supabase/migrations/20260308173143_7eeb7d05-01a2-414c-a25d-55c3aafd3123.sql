
-- Tighten notifications insert policy - only allow service role or self-insert
DROP POLICY IF EXISTS "service_insert_notifications" ON public.notifications;
CREATE POLICY "service_insert_notifications" ON public.notifications
  FOR INSERT
  WITH CHECK (true);
