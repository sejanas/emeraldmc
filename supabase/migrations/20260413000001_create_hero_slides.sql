-- Hero slides carousel for homepage
CREATE TABLE IF NOT EXISTS public.hero_slides (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  heading       text        NOT NULL CHECK (char_length(heading) <= 80),
  subtitle      text        NOT NULL CHECK (char_length(subtitle) <= 200),
  image_url     text        NOT NULL,
  display_order integer     NOT NULL DEFAULT 0,
  is_active     boolean     NOT NULL DEFAULT true,
  created_by    uuid,
  updated_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz,
  deleted_at    timestamptz
);

-- RLS
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hero_slides_select" ON public.hero_slides FOR SELECT USING (true);
CREATE POLICY "hero_slides_insert" ON public.hero_slides FOR INSERT WITH CHECK (true);
CREATE POLICY "hero_slides_update" ON public.hero_slides FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "hero_slides_delete" ON public.hero_slides FOR DELETE USING (true);

-- Seed 3 initial slides
INSERT INTO public.hero_slides (heading, subtitle, image_url, display_order, is_active) VALUES
  ('Bringing World Class Care to the Islands', 'Shifa''s Mainland Healthcare — ISO Certified Diagnostic Lab providing reliable health tests, affordable packages, and free home sample collection in Sri Vijaya Puram.', '/hero-slides/slide2.svg', 0, true),
  ('Your Health, Our Priority', 'Advanced diagnostic testing with state-of-the-art equipment and experienced pathologists. Accurate results you can trust, delivered on time.', '/hero-slides/slide2.svg', 1, true),
  ('Free Home Sample Collection', 'Skip the wait — book a home visit and get your samples collected at your doorstep. Available across Port Blair and nearby areas.', '/hero-slides/slide3.svg', 2, true);
