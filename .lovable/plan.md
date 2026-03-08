

# Clear Tests, Re-seed from File, Multi-Category Support

## What Changes

Each test can belong to **multiple categories**. A new junction table `test_category_map` links tests to categories. The existing `category_id` on `tests` stays as the **primary** category for backward compatibility.

- Sheet 1 (Biochemistry) tests get **2 categories**: their specific one (Diabetes, Lipid Profile, etc.) **+ Biochemistry**
- Sheet 2 tests like CBC, ESR, Hemoglobin, Blood Grouping are already in **Hematology only** — no second category needed
- Sheet 2 tests in Clinical Pathology, Coagulation, Serology — just their own category (1 each)

## Database Changes

### 1. Migration: Create `test_category_map` table

```sql
CREATE TABLE public.test_category_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES test_categories(id) ON DELETE CASCADE,
  UNIQUE(test_id, category_id)
);
ALTER TABLE test_category_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON test_category_map FOR SELECT USING (true);
CREATE POLICY "Admins manage" ON test_category_map FOR ALL USING (has_role(auth.uid(), 'admin'));
```

### 2. Data Operations (insert tool)

- `DELETE FROM package_tests` — clear FK references
- `DELETE FROM tests` — clear all tests
- Delete unused categories: **Vitamin & Hormone**, **Infection Panels**, **Vitamin & Mineral**
- Insert 55 tests with `category_id` = primary specific category
- Insert `test_category_map` rows:
  - All 33 Sheet 1 tests → mapped to **Biochemistry** (in addition to their primary category)
  - Sheet 2 Hematology tests (CBC, ESR, Hb, Blood Grouping) → no extra mapping needed (primary = Hematology)
  - Other Sheet 2 tests → no extra mapping (just their primary: Clinical Pathology / Coagulation / Serology)

### Categories After Cleanup (10 total)

Hematology, Biochemistry, Thyroid, Diabetes, Lipid Profile, Liver Function, Kidney Function, Special Test, Clinical Pathology, Coagulation, Serology

Removed: Vitamin & Hormone, Infection Panels, Vitamin & Mineral

## Code Changes

### Edge Function (`supabase/functions/api/index.ts`)

Update the tests list endpoint to also fetch `test_category_map` entries and return a `categories` array per test:

```typescript
// After fetching tests, also fetch their category mappings
const { data: mappings } = await db.from("test_category_map")
  .select("test_id, category_id, test_categories(id, name)");
// Attach categories array to each test
```

### `src/pages/TestsPage.tsx`

- Show multiple category badges per test card
- Category filter: match if the test has the selected category in **any** of its categories (primary or mapped)

### `src/pages/admin/AdminTests.tsx`

- Replace single category `Select` with a **multi-checkbox** selector
- On save: update `tests.category_id` (primary) + sync `test_category_map` entries
- Show all categories in the table column (comma-separated)

### `src/pages/Index.tsx`

- Update popular tests section to show multiple category badges from the categories array

### `src/hooks/useTests.ts`

- No structural change — data shape comes from the API, just needs to handle the new `categories` array field

### `src/hooks/useCategoriesMutations.ts`

- No change needed

