-- RLS policies for main content tables
-- Public can read; only admins can write

-- test_categories
ALTER TABLE public.test_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read categories"   ON public.test_categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON public.test_categories FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update categories" ON public.test_categories FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete categories" ON public.test_categories FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- tests
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read tests"   ON public.tests FOR SELECT USING (true);
CREATE POLICY "Admins can insert tests" ON public.tests FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update tests" ON public.tests FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete tests" ON public.tests FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- packages
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read packages"   ON public.packages FOR SELECT USING (true);
CREATE POLICY "Admins can insert packages" ON public.packages FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update packages" ON public.packages FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete packages" ON public.packages FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- package_tests (join table)
ALTER TABLE public.package_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read package_tests"   ON public.package_tests FOR SELECT USING (true);
CREATE POLICY "Admins can insert package_tests" ON public.package_tests FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update package_tests" ON public.package_tests FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete package_tests" ON public.package_tests FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- doctors
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read doctors"   ON public.doctors FOR SELECT USING (true);
CREATE POLICY "Admins can insert doctors" ON public.doctors FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update doctors" ON public.doctors FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete doctors" ON public.doctors FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- gallery
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read gallery"   ON public.gallery FOR SELECT USING (true);
CREATE POLICY "Admins can insert gallery" ON public.gallery FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update gallery" ON public.gallery FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete gallery" ON public.gallery FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
