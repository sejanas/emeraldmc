-- Add columns to record declines on user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS declined_by uuid,
  ADD COLUMN IF NOT EXISTS declined_at timestamptz,
  ADD COLUMN IF NOT EXISTS decline_reason text;

-- Optionally add a foreign key reference if auth.users exists
-- ALTER TABLE public.user_profiles
--   ADD CONSTRAINT user_profiles_declined_by_fkey FOREIGN KEY (declined_by) REFERENCES auth.users (id) ON DELETE SET NULL;
