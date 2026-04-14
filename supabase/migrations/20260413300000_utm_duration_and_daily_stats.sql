-- UTM tracking columns
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS utm_source text;
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS utm_medium text;
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS utm_campaign text;

-- Page engagement duration (seconds)
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS duration_sec smallint;

-- Index for UTM-based queries
CREATE INDEX IF NOT EXISTS idx_visitors_utm_source ON public.visitors (utm_source) WHERE utm_source IS NOT NULL;

-- Materialized view: daily aggregated stats for fast historical queries
CREATE MATERIALIZED VIEW IF NOT EXISTS public.visitor_daily_stats AS
SELECT
  (visited_at AT TIME ZONE 'UTC')::date AS day,
  country,
  page,
  COALESCE(utm_source, 'direct') AS utm_source,
  count(*) AS visits,
  count(DISTINCT visitor_hash) AS unique_visitors,
  round(avg(duration_sec) FILTER (WHERE duration_sec IS NOT NULL))::int AS avg_duration_sec,
  count(*) FILTER (WHERE is_bot) AS bot_count
FROM public.visitors
GROUP BY 1, 2, 3, 4;

-- Unique index required for REFRESH MATERIALIZED VIEW CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_vds_day_country_page_utm
  ON public.visitor_daily_stats (day, country, page, utm_source);

CREATE INDEX IF NOT EXISTS idx_vds_day ON public.visitor_daily_stats (day);
