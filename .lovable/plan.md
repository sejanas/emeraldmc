

# Add Tests from Rate List + Split Price into Original & Discounted

## Extracted Tests from the Excel File

**Sheet 1 — Biochemistry:**

| Test | Price | Category | Fasting | Sample | Report |
|------|-------|----------|---------|--------|--------|
| Blood Sugar Fasting | ₹50 | Diabetes | Yes | Blood | Same Day |
| Blood Sugar Post Prandial | ₹50 | Diabetes | No | Blood | Same Day |
| Blood Sugar Random | ₹50 | Diabetes | No | Blood | Same Day |
| Glucose Tolerance Test (GTT) | ₹500 | Diabetes | Yes | Blood | Same Day |
| HbA1c (Glycosylated Hemoglobin) | ₹600 | Diabetes | No | Blood | Next Day |
| Complete Lipid Profile | ₹1000 | Lipid Profile | Yes | Blood | Same Day |
| Cholesterol | ₹300 | Lipid Profile | Yes | Blood | Same Day |
| Cholesterol LDL | ₹300 | Lipid Profile | Yes | Blood | Same Day |
| Cholesterol HDL | ₹300 | Lipid Profile | Yes | Blood | Same Day |
| KFT with Electrolyte | ₹1000 | Kidney Function | No | Blood | Same Day |
| Renal Function Test | ₹800 | Kidney Function | No | Blood | Same Day |
| Blood Urea Level | ₹300 | Kidney Function | No | Blood | Same Day |
| Serum Creatinine | ₹300 | Kidney Function | No | Blood | Same Day |
| Uric Acid | ₹300 | Kidney Function | No | Blood | Same Day |
| Serum Electrolyte | ₹600 | Kidney Function | No | Blood | Same Day |
| Calcium | ₹300 | Biochemistry | No | Blood | Same Day |
| Serum Phosphorus | ₹300 | Biochemistry | No | Blood | Same Day |
| Liver Function Test (LFT) | ₹1000 | Liver Function | Yes | Blood | Same Day |
| Total Bilirubin | ₹300 | Liver Function | No | Blood | Same Day |
| Serum Albumin | ₹300 | Liver Function | No | Blood | Same Day |
| Serum Alkaline Phosphatase | ₹300 | Liver Function | No | Blood | Same Day |
| Total Protein | ₹300 | Liver Function | No | Blood | Same Day |
| GGT | ₹300 | Liver Function | No | Blood | Same Day |
| SGOT (AST) | ₹300 | Liver Function | No | Blood | Same Day |
| SGPT (ALT) | ₹300 | Liver Function | No | Blood | Same Day |
| Rheumatoid Factor (RA) | ₹600 | Special Test | No | Blood | Same Day |
| CRP (C-Reactive Protein) | ₹800 | Special Test | No | Blood | Same Day |
| ASO (Anti-Streptolysin O) | ₹600 | Special Test | No | Blood | Same Day |
| IgE (Immunoglobulin E) | ₹1100 | Special Test | No | Blood | 2 Days |
| CA-125 | ₹1500 | Special Test | No | Blood | 2 Days |
| Serum Iron | ₹600 | Vitamin & Mineral | No | Blood | Same Day |
| Vitamin D | ₹1500 | Vitamin & Hormone | No | Blood | 2 Days |
| Vitamin B12 | ₹1500 | Vitamin & Hormone | No | Blood | 2 Days |
| T3 | ₹300 | Thyroid | No | Blood | Next Day |
| T4 | ₹300 | Thyroid | No | Blood | Next Day |
| TSH | ₹300 | Thyroid | No | Blood | Next Day |
| Thyroid Function Test (T3+T4+TSH) | ₹1000 | Thyroid | No | Blood | Next Day |

**Sheet 2 — Hematology / Serology / Clinical Pathology:**

| Test | Price | Category | Fasting | Sample | Report |
|------|-------|----------|---------|--------|--------|
| CBC (Complete Blood Count) | ₹500 | Hematology | No | Blood | Same Day |
| ESR | ₹300 | Hematology | No | Blood | Same Day |
| Hemoglobin (Hb) | ₹300 | Hematology | No | Blood | Same Day |
| Blood Grouping | ₹100 | Hematology | No | Blood | Same Day |
| Urine Routine | ₹300 | Clinical Pathology | No | Urine | Same Day |
| Urine Protein & Sugar | ₹200 | Clinical Pathology | No | Urine | Same Day |
| Urine Sugar | ₹100 | Clinical Pathology | No | Urine | Same Day |
| Urine Pregnancy Test | ₹200 | Clinical Pathology | No | Urine | Same Day |
| PT & INR | ₹600 | Coagulation | No | Blood | Same Day |
| APTT | ₹600 | Coagulation | No | Blood | Same Day |
| HIV | ₹600 | Serology | No | Blood | Same Day |
| HBsAg | ₹600 | Serology | No | Blood | Same Day |
| Anti-HCV | ₹600 | Serology | No | Blood | Same Day |
| Troponin T | ₹800 | Serology | No | Blood | Same Day |
| Malaria Antigen | ₹300 | Infection Panels | No | Blood | Same Day |
| Widal Test (Typhoid) | ₹300 | Infection Panels | No | Blood | Same Day |
| Dengue NS1 + IgG + IgM | ₹600 | Infection Panels | No | Blood | Same Day |
| Chikungunya | ₹600 | Infection Panels | No | Blood | Same Day |

---

## Schema Change: Split Price

Add `original_price` and `discounted_price` columns to the `tests` table. Keep existing `price` as the actual selling price.

```sql
ALTER TABLE public.tests ADD COLUMN original_price integer;
ALTER TABLE public.tests ADD COLUMN discounted_price integer;
-- Backfill: set original_price = price (mark-up ~20-30%), discounted_price = current price
UPDATE public.tests SET original_price = CEIL(price * 1.25), discounted_price = price;
```

This gives a "was ₹X, now ₹Y" display. The `price` column remains the canonical selling price (= discounted_price).

---

## New Categories to Create

Add missing categories that don't exist yet: **Special Test**, **Clinical Pathology**, **Coagulation**, **Serology**. Existing categories (Hematology, Biochemistry, Diabetes, etc.) will be reused.

---

## Implementation Steps

### 1. Database Migration
- Add `original_price` and `discounted_price` columns to `tests`
- Backfill existing tests with original_price = ceil(price * 1.25)

### 2. Seed New Categories + Tests
- Insert missing categories via the edge function or insert tool
- Insert all ~55 unique tests with correct category_id references, prices, fasting, sample_type, report_time
- Set `original_price` slightly higher than `price` (the rate list price) to show a discount

### 3. Update UI — Price Display
All pages showing `₹{t.price}` will show strikethrough original + bold discounted:

- **TestsPage.tsx**: `<span className="line-through text-muted-foreground text-sm">₹{t.original_price}</span> <span className="font-bold text-primary">₹{t.price}</span>`
- **Index.tsx**: Same pattern in popular tests + search results
- **BookingPage.tsx**: Show discounted price in select dropdown
- **AdminTests.tsx**: Add original_price field to form, show both in table

### 4. Update Admin Form
- Add "Original Price (MRP)" field alongside existing "Price" field (rename to "Discounted Price")
- Show both in the tests table

### 5. Update Edge Function
- Ensure `createTest` / `updateTest` handlers accept `original_price` and `discounted_price`

