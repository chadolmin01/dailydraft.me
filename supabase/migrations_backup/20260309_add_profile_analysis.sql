ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS profile_analysis jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS profile_analysis_at timestamptz DEFAULT NULL;
