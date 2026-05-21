-- Add missing columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_image_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS affiliation_type text DEFAULT 'student';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_uni_verified boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS portfolio_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS github_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url text;
