ALTER TABLE public.certifications
  ADD COLUMN IF NOT EXISTS show_on_homepage boolean DEFAULT true;
