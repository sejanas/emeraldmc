
-- Visitors tracking table
CREATE TABLE IF NOT EXISTS public.visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text,
  user_agent text,
  page text NOT NULL DEFAULT '/',
  referrer text,
  visited_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (track visit)
CREATE POLICY "Anyone can insert visits" ON public.visitors FOR INSERT WITH CHECK (true);
-- Only admins can read
CREATE POLICY "Admins can read visits" ON public.visitors FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);

-- Storage RLS policies
CREATE POLICY "Public read images" ON storage.objects FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "Admins upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update images" ON storage.objects FOR UPDATE USING (bucket_id = 'images' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete images" ON storage.objects FOR DELETE USING (bucket_id = 'images' AND has_role(auth.uid(), 'admin'::app_role));
