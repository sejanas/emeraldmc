
-- 2. Add columns to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS sample_collected_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS booking_source text DEFAULT 'website',
  ADD COLUMN IF NOT EXISTS assigned_to uuid,
  ADD COLUMN IF NOT EXISTS patient_id text,
  ADD COLUMN IF NOT EXISTS extra_phones text[];

-- 3. Create booking_updates table
CREATE TABLE public.booking_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  update_type text NOT NULL,
  old_value text,
  new_value text,
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_updates ENABLE ROW LEVEL SECURITY;

-- 4. RLS for booking_updates - use has_role function
-- We need to also handle booking_manager via a helper since has_role only checks user_roles table
CREATE POLICY "staff_select_booking_updates" ON public.booking_updates
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'booking_manager'::app_role)
  );

CREATE POLICY "staff_insert_booking_updates" ON public.booking_updates
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'booking_manager'::app_role)
  );

-- 5. Update bookings RLS to also allow booking_manager
CREATE POLICY "booking_manager_select_bookings" ON public.bookings
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'booking_manager'::app_role));

CREATE POLICY "booking_manager_update_bookings" ON public.bookings
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'booking_manager'::app_role));
