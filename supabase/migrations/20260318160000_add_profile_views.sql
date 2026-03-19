-- Add profile_views column to track how many times a profile has been viewed
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_views integer DEFAULT 0;
