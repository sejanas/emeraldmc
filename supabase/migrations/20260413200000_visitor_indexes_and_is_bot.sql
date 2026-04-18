-- Phase 1: Performance indexes for visitors table
CREATE INDEX IF NOT EXISTS idx_visitors_ip_hash ON public.visitors (ip_hash);
CREATE INDEX IF NOT EXISTS idx_visitors_visited_at ON public.visitors (visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitors_country ON public.visitors (country);
CREATE INDEX IF NOT EXISTS idx_visitors_page ON public.visitors (page);
CREATE INDEX IF NOT EXISTS idx_visitors_visitor_hash ON public.visitors (visitor_hash);

-- Phase 2: Bot tracking column — bots still recorded, filtered at query time
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS is_bot boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_visitors_is_bot ON public.visitors (is_bot);
