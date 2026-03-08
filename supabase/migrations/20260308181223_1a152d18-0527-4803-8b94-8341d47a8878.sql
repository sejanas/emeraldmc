CREATE TABLE public.test_category_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.test_categories(id) ON DELETE CASCADE,
  UNIQUE(test_id, category_id)
);

ALTER TABLE public.test_category_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read test_category_map" ON public.test_category_map
  FOR SELECT USING (true);

CREATE POLICY "Admins manage test_category_map" ON public.test_category_map
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));