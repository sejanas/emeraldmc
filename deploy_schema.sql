-- ================================================================
-- deploy_schema.sql  — destination: mqriorwezhlkihjxnpdj
-- Step 1: CREATE TABLE  (tables were created by Lovable UI, not migrations)
-- Step 2: Migrations     (RLS policies, ALTER TABLE, etc.)
-- Paste the ENTIRE file into the destination SQL Editor → Run
-- ================================================================

-- Enum type
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'booking_manager');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Tier 1: No FK dependencies ───────────────────────────────────

CREATE TABLE IF NOT EXISTS public.test_categories (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name          text        NOT NULL,
  slug          text        NOT NULL,
  display_order integer     NOT NULL DEFAULT 0,
  created_by    uuid,
  updated_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz
);

CREATE TABLE IF NOT EXISTS public.packages (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name              text        NOT NULL,
  slug              text        NOT NULL,
  description       text,
  original_price    numeric     NOT NULL DEFAULT 0,
  discounted_price  numeric,
  discount_percent  numeric,
  image_url         text,
  is_popular        boolean     NOT NULL DEFAULT false,
  is_active         boolean     DEFAULT true,
  display_order     integer     NOT NULL DEFAULT 0,
  instructions      text,
  savings_override  numeric,
  show_test_count   boolean,
  featured_test_ids uuid[],
  created_by        uuid,
  updated_by        uuid,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz,
  deleted_at        timestamptz
);

CREATE TABLE IF NOT EXISTS public.doctors (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name             text        NOT NULL,
  slug             text        NOT NULL,
  specialization   text        NOT NULL,
  qualification    text,
  experience_years integer,
  bio              text,
  profile_image    text,
  display_order    integer     NOT NULL DEFAULT 0,
  extra_fields     jsonb,
  created_by       uuid,
  updated_by       uuid,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz,
  deleted_at       timestamptz
);

CREATE TABLE IF NOT EXISTS public.gallery (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  title         text        NOT NULL,
  image_url     text        NOT NULL,
  category      text        NOT NULL DEFAULT 'general',
  description   text,
  display_order integer     NOT NULL DEFAULT 0,
  uploaded_at   timestamptz NOT NULL DEFAULT now(),
  created_by    uuid,
  updated_by    uuid,
  updated_at    timestamptz,
  deleted_at    timestamptz
);

CREATE TABLE IF NOT EXISTS public.faqs (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  question      text        NOT NULL,
  answer        text        NOT NULL,
  slug          text        NOT NULL,
  display_order integer     NOT NULL DEFAULT 0,
  is_active     boolean     NOT NULL DEFAULT true,
  created_by    uuid,
  updated_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz,
  deleted_at    timestamptz
);

CREATE TABLE IF NOT EXISTS public.blogs (
  id                 uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  title              text        NOT NULL,
  slug               text        NOT NULL UNIQUE,
  content            text,
  excerpt            text,
  featured_image     text,
  author             text,
  author_credentials text,
  category           text,
  tags               text[],
  meta_title         text,
  meta_description   text,
  external_url       text,
  status             text        NOT NULL DEFAULT 'draft',
  scheduled_at       timestamptz,
  published_at       timestamptz,
  read_time          text,
  display_order      integer,
  created_by         uuid,
  updated_by         uuid,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz,
  deleted_at         timestamptz
);

CREATE TABLE IF NOT EXISTS public.certifications (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name              text        NOT NULL,
  slug              text        NOT NULL,
  issuing_authority text,
  description       text,
  image_url         text,
  authority_logo    text,
  certificate_id    text,
  valid_till        date,
  is_verified       boolean,
  is_active         boolean,
  display_order     integer,
  created_by        uuid,
  updated_by        uuid,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz,
  deleted_at        timestamptz
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  key        text        NOT NULL UNIQUE,
  value      jsonb       NOT NULL,
  updated_at timestamptz,
  updated_by uuid
);

CREATE TABLE IF NOT EXISTS public.visitors (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_hash    text,
  user_agent text,
  page       text        NOT NULL DEFAULT '/',
  referrer   text,
  city       text,
  region     text,
  country    text,
  visited_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type    text        NOT NULL,
  user_id       uuid,
  entity_type   text,
  entity_id     text,
  entity_name   text,
  changes       jsonb,
  ip_address    text,
  request_id    text,
  action_source text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL,
  title       text        NOT NULL,
  message     text,
  type        text        NOT NULL DEFAULT 'info',
  entity_type text,
  entity_id   text,
  is_read     boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- User tables (FK → auth.users, populated last via --import-csvs)

CREATE TABLE IF NOT EXISTS public.user_roles (
  id         uuid            DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid            NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.app_role NOT NULL,
  created_at timestamptz     NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid        NOT NULL,
  name           text        NOT NULL,
  clinic_role    text,
  role           text        NOT NULL DEFAULT 'user',
  status         text        NOT NULL DEFAULT 'pending',
  avatar_url     text,
  approved_at    timestamptz,
  approved_by    uuid,
  declined_at    timestamptz,
  declined_by    uuid,
  decline_reason text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_phones (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL,
  phone      text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_emails (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL,
  email      text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Tier 2: References Tier 1 ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tests (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name              text        NOT NULL,
  slug              text        NOT NULL,
  category_id       uuid        REFERENCES public.test_categories(id),
  description       text,
  sample_type       text        NOT NULL DEFAULT 'blood',
  report_time       text        NOT NULL DEFAULT '24 hours',
  fasting_required  boolean     NOT NULL DEFAULT false,
  price             numeric     NOT NULL DEFAULT 0,
  original_price    numeric,
  discounted_price  numeric,
  discount_override numeric,
  is_active         boolean     NOT NULL DEFAULT true,
  show_on_homepage  boolean,
  display_order     integer     NOT NULL DEFAULT 0,
  preparation       text,
  created_by        uuid,
  updated_by        uuid,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz,
  deleted_at        timestamptz
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_name        text        NOT NULL,
  phone               text        NOT NULL,
  email               text,
  selected_tests      text[],
  selected_package    text,
  preferred_date      text        NOT NULL,
  preferred_time      text        NOT NULL,
  address             text,
  notes               text,
  status              text        NOT NULL DEFAULT 'pending',
  assigned_to         uuid,
  booking_source      text,
  confirmed_at        timestamptz,
  sample_collected_at timestamptz,
  completed_at        timestamptz,
  cancelled_at        timestamptz,
  patient_id          uuid,
  extra_phones        text[],
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz
);

-- ── Tier 3: References Tier 2 ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.sub_tests (
  id                 uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id            uuid        NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  name               text        NOT NULL,
  is_visible         boolean     NOT NULL DEFAULT true,
  display_order      integer     NOT NULL DEFAULT 0,
  show_as_individual boolean     NOT NULL DEFAULT false,
  price              numeric,
  original_price     numeric,
  discounted_price   numeric,
  discount_override  numeric,
  sample_type        text,
  report_time        text,
  fasting_required   boolean     NOT NULL DEFAULT false,
  description        text,
  slug               text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.test_category_map (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id     uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.test_categories(id) ON DELETE CASCADE,
  UNIQUE (test_id, category_id)
);

CREATE TABLE IF NOT EXISTS public.package_tests (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id uuid NOT NULL REFERENCES public.packages(id),
  test_id    uuid NOT NULL REFERENCES public.tests(id)
);

CREATE TABLE IF NOT EXISTS public.booking_updates (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id  uuid        NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  update_type text        NOT NULL,
  old_value   text,
  new_value   text,
  note        text,
  created_by  uuid,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Function ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS
$$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Enable RLS on all tables
ALTER TABLE public.test_categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_phones       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_emails       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_tests         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_category_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_tests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_updates   ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- MIGRATION FILES (RLS policies + ALTER TABLE statements)
-- ================================================================

-- ── 20260306100000_create_roles.sql ──────────────────
-- Create app_role enum
DO $mig$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $mig$;

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own role
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- has_role: SECURITY DEFINER bypasses RLS so the function can always query user_roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;


-- ── 20260306123455_b3e2a147-828a-471d-9174-de732814b64c.sql ──────────────────

-- Visitors tracking table
CREATE TABLE IF NOT EXISTS public.visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text,
  user_agent text,
  page text NOT NULL DEFAULT '/',
  referrer text,
  visited_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (track visit)
DROP POLICY IF EXISTS "Anyone can insert visits" ON public.visitors;
CREATE POLICY "Anyone can insert visits" ON public.visitors FOR INSERT WITH CHECK (true);
-- Only admins can read
DROP POLICY IF EXISTS "Admins can read visits" ON public.visitors;
CREATE POLICY "Admins can read visits" ON public.visitors FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);

-- Storage RLS policies
DROP POLICY IF EXISTS "Public read images" ON storage.objects;
CREATE POLICY "Public read images" ON storage.objects FOR SELECT USING (bucket_id = 'images');
DROP POLICY IF EXISTS "Admins upload images" ON storage.objects;
CREATE POLICY "Admins upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images' AND has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins update images" ON storage.objects;
CREATE POLICY "Admins update images" ON storage.objects FOR UPDATE USING (bucket_id = 'images' AND has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins delete images" ON storage.objects;
CREATE POLICY "Admins delete images" ON storage.objects FOR DELETE USING (bucket_id = 'images' AND has_role(auth.uid(), 'admin'::app_role));


-- ── 20260306200000_content_table_rls.sql ──────────────────
-- RLS policies for main content tables
-- Public can read; only admins can write

-- test_categories
ALTER TABLE public.test_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read categories" ON public.test_categories;
CREATE POLICY "Public can read categories"   ON public.test_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can insert categories" ON public.test_categories;
CREATE POLICY "Admins can insert categories" ON public.test_categories FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update categories" ON public.test_categories;
CREATE POLICY "Admins can update categories" ON public.test_categories FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can delete categories" ON public.test_categories;
CREATE POLICY "Admins can delete categories" ON public.test_categories FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- tests
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read tests" ON public.tests;
CREATE POLICY "Public can read tests"   ON public.tests FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can insert tests" ON public.tests;
CREATE POLICY "Admins can insert tests" ON public.tests FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update tests" ON public.tests;
CREATE POLICY "Admins can update tests" ON public.tests FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can delete tests" ON public.tests;
CREATE POLICY "Admins can delete tests" ON public.tests FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- packages
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read packages" ON public.packages;
CREATE POLICY "Public can read packages"   ON public.packages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can insert packages" ON public.packages;
CREATE POLICY "Admins can insert packages" ON public.packages FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update packages" ON public.packages;
CREATE POLICY "Admins can update packages" ON public.packages FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can delete packages" ON public.packages;
CREATE POLICY "Admins can delete packages" ON public.packages FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- package_tests (join table)
ALTER TABLE public.package_tests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read package_tests" ON public.package_tests;
CREATE POLICY "Public can read package_tests"   ON public.package_tests FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can insert package_tests" ON public.package_tests;
CREATE POLICY "Admins can insert package_tests" ON public.package_tests FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update package_tests" ON public.package_tests;
CREATE POLICY "Admins can update package_tests" ON public.package_tests FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can delete package_tests" ON public.package_tests;
CREATE POLICY "Admins can delete package_tests" ON public.package_tests FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- doctors
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read doctors" ON public.doctors;
CREATE POLICY "Public can read doctors"   ON public.doctors FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can insert doctors" ON public.doctors;
CREATE POLICY "Admins can insert doctors" ON public.doctors FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update doctors" ON public.doctors;
CREATE POLICY "Admins can update doctors" ON public.doctors FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can delete doctors" ON public.doctors;
CREATE POLICY "Admins can delete doctors" ON public.doctors FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- gallery
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read gallery" ON public.gallery;
CREATE POLICY "Public can read gallery"   ON public.gallery FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can insert gallery" ON public.gallery;
CREATE POLICY "Admins can insert gallery" ON public.gallery FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update gallery" ON public.gallery;
CREATE POLICY "Admins can update gallery" ON public.gallery FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can delete gallery" ON public.gallery;
CREATE POLICY "Admins can delete gallery" ON public.gallery FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));


-- ── 20260307175738_a0ddb42e-7cfb-426d-bd6a-1a5cd6b20ec2.sql ──────────────────

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
DROP POLICY IF EXISTS "users_read_own_profile" ON public.user_profiles;
CREATE POLICY "users_read_own_profile" ON public.user_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.user_phones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  phone text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_phones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_manage_own_phones" ON public.user_phones;
CREATE POLICY "users_manage_own_phones" ON public.user_phones FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.user_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_emails ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_manage_own_emails" ON public.user_emails;
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
DROP POLICY IF EXISTS "anyone_insert_bookings" ON public.bookings;
CREATE POLICY "anyone_insert_bookings" ON public.bookings FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "admins_select_bookings" ON public.bookings;
CREATE POLICY "admins_select_bookings" ON public.bookings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "admins_update_bookings" ON public.bookings;
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
DROP POLICY IF EXISTS "users_read_own_logs" ON public.activity_logs;
CREATE POLICY "users_read_own_logs" ON public.activity_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "service_insert_logs" ON public.activity_logs;
CREATE POLICY "service_insert_logs" ON public.activity_logs FOR INSERT WITH CHECK (true);


-- ── 20260308000001_rls_admin_policies.sql ──────────────────
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
DROP POLICY IF EXISTS "admins_read_all_profiles" ON public.user_profiles;
CREATE POLICY "admins_read_all_profiles"
  ON public.user_profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Admins can update profiles (approve, revoke, promote).
DROP POLICY IF EXISTS "admins_update_profiles" ON public.user_profiles;
CREATE POLICY "admins_update_profiles"
  ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ── activity_logs ───────────────────────────────────────────

-- Admins can read all activity logs (super_admin sees all via the API;
-- this policy enables the same through direct connections).
DROP POLICY IF EXISTS "admins_read_all_logs" ON public.activity_logs;
CREATE POLICY "admins_read_all_logs"
  ON public.activity_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ── bookings ────────────────────────────────────────────────

-- Public users can only INSERT new bookings (already set); admins can
-- DELETE cancelled bookings if needed (soft-deletes preferred via API).
DROP POLICY IF EXISTS "admins_delete_bookings" ON public.bookings;
CREATE POLICY "admins_delete_bookings"
  ON public.bookings
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));


-- ── 20260308064112_44e11010-170d-480f-8f92-be9b7766f3b7.sql ──────────────────
CREATE TABLE IF NOT EXISTS public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  slug text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active faqs" ON public.faqs;
CREATE POLICY "Public read active faqs" ON public.faqs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage faqs" ON public.faqs;
CREATE POLICY "Admins manage faqs" ON public.faqs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ── 20260308065636_3c36ffe4-5c91-4896-96e3-24f47f7e87de.sql ──────────────────
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS country text;

-- ── 20260308071848_994f6354-364f-4b1b-b45b-9fdc7b6816b5.sql ──────────────────
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS decline_reason text,
  ADD COLUMN IF NOT EXISTS declined_at timestamptz,
  ADD COLUMN IF NOT EXISTS declined_by uuid;

-- ── 20260308120000_add_declined_fields.sql ──────────────────
-- Add columns to record declines on user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS declined_by uuid,
  ADD COLUMN IF NOT EXISTS declined_at timestamptz,
  ADD COLUMN IF NOT EXISTS decline_reason text;

-- Optionally add a foreign key reference if auth.users exists
-- ALTER TABLE public.user_profiles
--   ADD CONSTRAINT user_profiles_declined_by_fkey FOREIGN KEY (declined_by) REFERENCES auth.users (id) ON DELETE SET NULL;


-- ── 20260308134626_b78a5c8b-32bb-4e05-9a90-e9e4171c57ed.sql ──────────────────

CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read settings" ON public.site_settings;
CREATE POLICY "Public read settings" ON public.site_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage settings" ON public.site_settings;
CREATE POLICY "Admins manage settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.site_settings (key, value) VALUES ('theme_color', '{"preset": "emerald"}');


-- ── 20260308151444_626a5f13-f63a-4ccc-8306-822cc23a0b36.sql ──────────────────
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- ── 20260308170158_1ba2a71b-3d8d-421e-b30f-b7e27cd9a163.sql ──────────────────

-- 1. Add booking_manager to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'booking_manager';


-- ── 20260308170225_c1d4a722-01e4-40e4-935b-154db977e009.sql ──────────────────

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
CREATE TABLE IF NOT EXISTS public.booking_updates (
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
DROP POLICY IF EXISTS "staff_select_booking_updates" ON public.booking_updates;
CREATE POLICY "staff_select_booking_updates" ON public.booking_updates
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'booking_manager'::app_role)
  );

DROP POLICY IF EXISTS "staff_insert_booking_updates" ON public.booking_updates;
CREATE POLICY "staff_insert_booking_updates" ON public.booking_updates
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'booking_manager'::app_role)
  );

-- 5. Update bookings RLS to also allow booking_manager
DROP POLICY IF EXISTS "booking_manager_select_bookings" ON public.bookings;
CREATE POLICY "booking_manager_select_bookings" ON public.bookings
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'booking_manager'::app_role));

DROP POLICY IF EXISTS "booking_manager_update_bookings" ON public.bookings;
CREATE POLICY "booking_manager_update_bookings" ON public.bookings
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'booking_manager'::app_role));


-- ── 20260308173119_aca0f772-5f8f-4141-abbf-f570cc83e7b6.sql ──────────────────

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text,
  type text NOT NULL DEFAULT 'info',
  entity_type text,
  entity_id text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
DROP POLICY IF EXISTS "users_select_own_notifications" ON public.notifications;
CREATE POLICY "users_select_own_notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
DROP POLICY IF EXISTS "users_update_own_notifications" ON public.notifications;
CREATE POLICY "users_update_own_notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Service role inserts (via edge function)
DROP POLICY IF EXISTS "service_insert_notifications" ON public.notifications;
CREATE POLICY "service_insert_notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;


-- ── 20260308173143_7eeb7d05-01a2-414c-a25d-55c3aafd3123.sql ──────────────────

-- Tighten notifications insert policy - only allow service role or self-insert
DROP POLICY IF EXISTS "service_insert_notifications" ON public.notifications;
DROP POLICY IF EXISTS "service_insert_notifications" ON public.notifications;
CREATE POLICY "service_insert_notifications" ON public.notifications
  FOR INSERT
  WITH CHECK (true);


-- ── 20260308175146_0427fd08-94d1-4dca-a392-92a528bb5474.sql ──────────────────

ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS original_price integer;
ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS discounted_price integer;


-- ── 20260308181223_1a152d18-0527-4803-8b94-8341d47a8878.sql ──────────────────
CREATE TABLE IF NOT EXISTS public.test_category_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.test_categories(id) ON DELETE CASCADE,
  UNIQUE(test_id, category_id)
);

ALTER TABLE public.test_category_map ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read test_category_map" ON public.test_category_map;
CREATE POLICY "Public read test_category_map" ON public.test_category_map
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage test_category_map" ON public.test_category_map;
CREATE POLICY "Admins manage test_category_map" ON public.test_category_map
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ── 20260309032942_f2ae4734-fa9c-4e41-934a-f6ece63dacc2.sql ──────────────────

-- 1. Blogs table for full CMS
CREATE TABLE IF NOT EXISTS public.blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text DEFAULT '',
  excerpt text,
  featured_image text,
  author text,
  author_credentials text,
  category text,
  tags text[] DEFAULT '{}',
  meta_title text,
  meta_description text,
  external_url text,
  status text NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  published_at timestamptz,
  read_time text,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid,
  deleted_at timestamptz
);

ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published blogs" ON public.blogs;
CREATE POLICY "Public read published blogs" ON public.blogs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage blogs" ON public.blogs;
CREATE POLICY "Admins manage blogs" ON public.blogs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Certifications table
CREATE TABLE IF NOT EXISTS public.certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  issuing_authority text,
  description text,
  image_url text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid,
  deleted_at timestamptz
);

ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read certifications" ON public.certifications;
CREATE POLICY "Public read certifications" ON public.certifications
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage certifications" ON public.certifications;
CREATE POLICY "Admins manage certifications" ON public.certifications
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Add extra_fields JSONB to doctors
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS extra_fields jsonb DEFAULT '{}';


-- ── 20260316035414_11f03785-ce92-4c3d-a187-e81ac767841b.sql ──────────────────
-- Certifications: add authority_logo, certificate_id, valid_till, is_verified
ALTER TABLE public.certifications ADD COLUMN IF NOT EXISTS authority_logo text DEFAULT NULL;
ALTER TABLE public.certifications ADD COLUMN IF NOT EXISTS certificate_id text DEFAULT NULL;
ALTER TABLE public.certifications ADD COLUMN IF NOT EXISTS valid_till date DEFAULT NULL;
ALTER TABLE public.certifications ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- Tests: add show_on_homepage, discount_override
ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS show_on_homepage boolean DEFAULT false;
ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS discount_override numeric DEFAULT NULL;

-- Packages: add instructions, savings_override, show_test_count, featured_test_ids
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS instructions text DEFAULT NULL;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS savings_override integer DEFAULT NULL;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS show_test_count boolean DEFAULT true;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS featured_test_ids uuid[] DEFAULT '{}';

-- ── 20260316040000_add_is_active_to_packages.sql ──────────────────
-- Add is_active column to packages table
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;


-- ── 20260319100000_create_sub_tests.sql ──────────────────
-- Create sub_tests table for managing sub-tests/parameters under parent tests
CREATE TABLE IF NOT EXISTS sub_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_visible boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  show_as_individual boolean NOT NULL DEFAULT false,
  price numeric,
  original_price numeric,
  discounted_price numeric,
  discount_override numeric,
  sample_type text,
  report_time text,
  fasting_required boolean DEFAULT false,
  description text,
  slug text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by parent test
CREATE INDEX IF NOT EXISTS idx_sub_tests_test_id_order ON sub_tests(test_id, display_order);

-- Unique slug for individual sub-tests (partial index: only when slug is set)
CREATE UNIQUE INDEX IF NOT EXISTS idx_sub_tests_slug ON sub_tests(slug) WHERE slug IS NOT NULL;

-- RLS policies (match existing pattern for admin-managed tables)
ALTER TABLE sub_tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read for sub_tests" ON sub_tests;
CREATE POLICY "Allow public read for sub_tests"
  ON sub_tests FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow admin insert sub_tests" ON sub_tests;
CREATE POLICY "Allow admin insert sub_tests"
  ON sub_tests FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin update sub_tests" ON sub_tests;
CREATE POLICY "Allow admin update sub_tests"
  ON sub_tests FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin delete sub_tests" ON sub_tests;
CREATE POLICY "Allow admin delete sub_tests"
  ON sub_tests FOR DELETE
  USING (true);

