/**
 * build_schema.mjs — generates deploy_schema.sql
 * Run: node build_schema.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));

const createTables = `-- ================================================================
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

`;

const migDir = resolve(__dirname, 'supabase/migrations');
const migFiles = readdirSync(migDir).filter(f => f.endsWith('.sql')).sort();

let migrations = '\n-- ================================================================\n-- MIGRATION FILES (RLS policies + ALTER TABLE statements)\n-- ================================================================\n';
for (const f of migFiles) {
  let sql = readFileSync(`${migDir}/${f}`, 'utf8');

  // 1. Make bare CREATE TYPE idempotent
  sql = sql.replace(
    /CREATE TYPE\s+([^\s]+)\s+AS\s+ENUM\s*\([^)]+\)\s*;/gi,
    (match, typeName) =>
      `DO $mig$ BEGIN\n  ${match.trim()}\nEXCEPTION WHEN duplicate_object THEN NULL;\nEND $mig$;`,
  );

  // 2. Make bare CREATE TABLE idempotent (add IF NOT EXISTS where missing)
  sql = sql.replace(
    /CREATE TABLE(?!\s+IF\s+NOT\s+EXISTS)\s+/gi,
    'CREATE TABLE IF NOT EXISTS ',
  );

  // 3. Make CREATE POLICY idempotent — prepend DROP POLICY IF EXISTS before each one
  sql = sql.replace(
    /CREATE POLICY\s+"([^"]+)"\s+ON\s+([^\s(]+)/gi,
    (match, policyName, tableName) =>
      `DROP POLICY IF EXISTS "${policyName}" ON ${tableName};\n${match}`,
  );

  // 4. Make CREATE INDEX idempotent
  sql = sql.replace(
    /CREATE(?:\s+UNIQUE)?\s+INDEX(?!\s+IF\s+NOT\s+EXISTS)\s+/gi,
    (m) => m.replace(/INDEX\s+/i, 'INDEX IF NOT EXISTS '),
  );

  migrations += `\n-- ── ${f} ──────────────────\n`;
  migrations += sql;
  migrations += '\n';
}

const final = createTables + migrations;
writeFileSync(resolve(__dirname, 'deploy_schema.sql'), final, 'utf8');
console.log(`deploy_schema.sql rebuilt: ${Math.round(final.length / 1024)}KB (${migFiles.length} migrations + CREATE TABLE for 21 tables)`);
