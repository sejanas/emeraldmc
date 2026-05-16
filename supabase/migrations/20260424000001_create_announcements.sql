-- Announcements: generalized, dynamic, customizable announcement system
-- Replaces the hardcoded VisitingDoctorModal + PromoBanner.
-- See /memories/session/plan.md for full design rationale.

CREATE TABLE IF NOT EXISTS public.announcements (
  id                    uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  schema_version        integer     NOT NULL DEFAULT 1,
  version               integer     NOT NULL DEFAULT 1, -- bumped by trigger on visible-content edits

  -- Identity / classification
  type                  text        NOT NULL,                       -- open vocab, app-validated
  title                 text        NOT NULL CHECK (char_length(title) <= 200),
  body                  text        NOT NULL DEFAULT '',            -- sanitized HTML
  image_url             text,
  icon                  text,                                       -- lucide icon name

  -- Placement & presentation
  placements            text[]      NOT NULL DEFAULT '{}',          -- subset of allowlist; ≥1 required (app validated)
  presentation          jsonb       NOT NULL DEFAULT '{}',          -- per-placement { variant, layout, size, trigger }

  -- Ordering / preemption
  severity              text        NOT NULL DEFAULT 'info'
                                    CHECK (severity IN ('info','notice','warning','critical')),
  priority              integer     NOT NULL DEFAULT 0,
  exclusive             boolean     NOT NULL DEFAULT false,

  -- Behavior
  frequency             jsonb       NOT NULL DEFAULT '{"strategy":"always"}',
  trigger               jsonb       NOT NULL DEFAULT '{"type":"on_load"}', -- default trigger; per-placement override lives in presentation
  page_rules            jsonb       NOT NULL DEFAULT '{}',          -- { include: string[], exclude: string[] }
  devices               text[]      NOT NULL DEFAULT '{mobile,tablet,desktop}',
  audience              text[]      NOT NULL DEFAULT '{all}',

  -- Schedule
  start_at              timestamptz,
  end_at                timestamptz,
  time_window           jsonb,                                      -- { start_time, end_time, timezone, days_of_week }

  -- Theme / appearance
  theme                 jsonb       NOT NULL DEFAULT '{}',          -- { accent_color, background_color, text_color, badge_style, layout_density, dark_mode_overrides }

  -- CTAs
  primary_cta_label     text,
  primary_cta_url       text,
  secondary_cta_label   text,
  secondary_cta_url     text,

  -- Type-specific structured fields
  metadata              jsonb       NOT NULL DEFAULT '{}',

  -- Flags
  dismissible           boolean     NOT NULL DEFAULT true,
  is_active             boolean     NOT NULL DEFAULT true,

  -- Reserved for v2 A/B testing
  variant_group         text,

  -- Audit
  created_by            uuid,
  updated_by            uuid,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  deleted_at            timestamptz,

  -- Sanity
  CONSTRAINT announcements_window_valid CHECK (start_at IS NULL OR end_at IS NULL OR start_at < end_at)
);

CREATE INDEX IF NOT EXISTS idx_announcements_active_window
  ON public.announcements (is_active, start_at, end_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_announcements_updated_at
  ON public.announcements (updated_at DESC)
  WHERE deleted_at IS NULL;

-- ── Version bump trigger ──
-- Auto-increments `version` when any field that changes the rendered output changes.
-- Dismissal key on the client is `${id}:${version}`, so meaningful edits re-show
-- the announcement to users who previously dismissed it.

CREATE OR REPLACE FUNCTION public.bump_announcement_version()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    IF (
      NEW.title              IS DISTINCT FROM OLD.title              OR
      NEW.body               IS DISTINCT FROM OLD.body               OR
      NEW.image_url          IS DISTINCT FROM OLD.image_url          OR
      NEW.icon               IS DISTINCT FROM OLD.icon               OR
      NEW.placements         IS DISTINCT FROM OLD.placements         OR
      NEW.presentation       IS DISTINCT FROM OLD.presentation       OR
      NEW.theme              IS DISTINCT FROM OLD.theme              OR
      NEW.metadata           IS DISTINCT FROM OLD.metadata           OR
      NEW.primary_cta_label  IS DISTINCT FROM OLD.primary_cta_label  OR
      NEW.primary_cta_url    IS DISTINCT FROM OLD.primary_cta_url    OR
      NEW.secondary_cta_label IS DISTINCT FROM OLD.secondary_cta_label OR
      NEW.secondary_cta_url  IS DISTINCT FROM OLD.secondary_cta_url
    ) THEN
      NEW.version := COALESCE(OLD.version, 1) + 1;
    END IF;
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS announcements_bump_version ON public.announcements;
CREATE TRIGGER announcements_bump_version
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.bump_announcement_version();

-- ── RLS ──
-- All writes go through the edge function (service role); RLS just guards direct anon access.
-- Public can SELECT non-deleted, active rows within their window. Admin reads happen via service role.

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcements_public_select"
  ON public.announcements
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND is_active = true
    AND (start_at IS NULL OR start_at <= now())
    AND (end_at   IS NULL OR end_at   >= now())
  );

-- Writes use the edge function (service role bypasses RLS). No broad FOR ALL policy.


-- ── announcement_events (analytics ─ schema only for v2) ──
-- v1 ships the schema + endpoint but client tracker is feature-flagged off.
CREATE TABLE IF NOT EXISTS public.announcement_events (
  id                    uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id       uuid        NOT NULL,
  announcement_version  integer     NOT NULL DEFAULT 1,
  variant_group         text,
  event_type            text        NOT NULL
                                    CHECK (event_type IN ('impression','engagement','click','cta_primary','cta_secondary','dismiss','auto_hide')),
  placement             text        NOT NULL,
  session_id            text,
  user_id               uuid,
  page_path             text,
  device                text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcement_events_lookup
  ON public.announcement_events (announcement_id, event_type, created_at DESC);

ALTER TABLE public.announcement_events ENABLE ROW LEVEL SECURITY;

-- No policies: anon/authenticated cannot read or write rows; edge function uses service role.


-- ── Seed: migrate the hardcoded Visiting Doctor data ──
-- Mirrors src/data/visitingDoctorEvent.ts so the new system renders identically on day one.
INSERT INTO public.announcements (
  type, title, body, image_url, icon,
  placements, presentation,
  severity, priority, exclusive,
  frequency, trigger,
  page_rules, devices, audience,
  start_at, end_at,
  theme,
  primary_cta_label, primary_cta_url,
  secondary_cta_label, secondary_cta_url,
  metadata,
  dismissible, is_active
) VALUES (
  'visiting_doctor',
  'Dr. Rukkayal Ashik — Visiting Specialist',
  'Gold medallist in MBBS and MS from Dr. M.G.R. Medical University. Member of RCOG London, Indian Fertility Society (IFS), and ISAR. Has helped 1000+ couples achieve parenthood through advanced ART.',
  'https://www.thehivefertility.in/wp-content/uploads/2023/07/4-web.webp',
  'Stethoscope',
  ARRAY['top_bar','popup'],
  '{"top_bar":{"variant":"slim_strip","layout":"image_left","size":"sm"},"popup":{"variant":"center_modal","layout":"image_left","size":"md","trigger":{"type":"delay","value":1000}}}'::jsonb,
  'notice', 100, false,
  '{"strategy":"once_per_day"}'::jsonb,
  '{"type":"on_load"}'::jsonb,
  '{}'::jsonb,
  ARRAY['mobile','tablet','desktop'],
  ARRAY['all'],
  '2026-04-25T00:00:00+05:30',
  '2026-04-26T23:59:59+05:30',
  '{"badge_style":"solid","layout_density":"comfortable"}'::jsonb,
  'Book Free Appointment',
  '/book?from=fertility-camp',
  'Learn more about Dr. Rukkayal',
  'https://www.thehivefertility.in/fertility-doctor-rukkayal-ashik/',
  jsonb_build_object(
    'doctor_name', 'Dr. Rukkayal Ashik',
    'credentials', 'MS OG, MRCOG (UK), FRM, FMAS, F ART',
    'role', 'Gynaecologist & Fertility Specialist',
    'organisation', 'The Hive Fertility & Women''s Centre, Chennai',
    'brand_logo_url', 'https://www.thehivefertility.in/wp-content/uploads/2023/07/logo-web.webp',
    'specialties', jsonb_build_array('IVF & ICSI','PCOD / PCOS','Endometriosis','Recurrent IVF Failures','Fertility Preservation','Laparoscopic Surgery'),
    'experience', '10+ years',
    'visit_label', 'Apr 25 – 26, 2026',
    'is_free', true,
    'badge_label', 'FREE CAMP'
  ),
  true, true
) ON CONFLICT DO NOTHING;
