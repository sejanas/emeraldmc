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