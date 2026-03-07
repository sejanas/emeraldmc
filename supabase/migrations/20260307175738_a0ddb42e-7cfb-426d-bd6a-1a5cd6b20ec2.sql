
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  clinic_role text,
  role text NOT NULL DEFAULT 'admin',
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own_profile" ON public.user_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.user_phones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  phone text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_phones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_manage_own_phones" ON public.user_phones FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.user_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_manage_own_emails" ON public.user_emails FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS created_by uuid, ADD COLUMN IF NOT EXISTS updated_by uuid, ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(), ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS preparation text, ADD COLUMN IF NOT EXISTS created_by uuid, ADD COLUMN IF NOT EXISTS updated_by uuid, ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(), ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS discount_percent numeric, ADD COLUMN IF NOT EXISTS image_url text, ADD COLUMN IF NOT EXISTS created_by uuid, ADD COLUMN IF NOT EXISTS updated_by uuid, ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(), ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.gallery ADD COLUMN IF NOT EXISTS description text, ADD COLUMN IF NOT EXISTS created_by uuid, ADD COLUMN IF NOT EXISTS updated_by uuid, ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(), ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.test_categories ADD COLUMN IF NOT EXISTS created_by uuid, ADD COLUMN IF NOT EXISTS updated_by uuid, ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name text NOT NULL,
  phone text NOT NULL,
  email text,
  selected_tests text[],
  selected_package text,
  preferred_date date NOT NULL,
  preferred_time text NOT NULL,
  address text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_insert_bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "admins_select_bookings" ON public.bookings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins_update_bookings" ON public.bookings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid,
  entity_type text,
  entity_id text,
  entity_name text,
  changes jsonb,
  ip_address text,
  request_id text,
  action_source text DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own_logs" ON public.activity_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "service_insert_logs" ON public.activity_logs FOR INSERT WITH CHECK (true);
