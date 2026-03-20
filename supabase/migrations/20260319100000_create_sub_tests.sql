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
CREATE INDEX idx_sub_tests_test_id_order ON sub_tests(test_id, display_order);

-- Unique slug for individual sub-tests (partial index: only when slug is set)
CREATE UNIQUE INDEX idx_sub_tests_slug ON sub_tests(slug) WHERE slug IS NOT NULL;

-- RLS policies (match existing pattern for admin-managed tables)
ALTER TABLE sub_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for sub_tests"
  ON sub_tests FOR SELECT
  USING (true);

CREATE POLICY "Allow admin insert sub_tests"
  ON sub_tests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow admin update sub_tests"
  ON sub_tests FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow admin delete sub_tests"
  ON sub_tests FOR DELETE
  USING (true);
