ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS country text;