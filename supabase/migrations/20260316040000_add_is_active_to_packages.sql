-- Add is_active column to packages table
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
