-- Profile interests (likes) table
CREATE TABLE IF NOT EXISTS profile_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, target_profile_id)
);

-- RLS
ALTER TABLE profile_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view profile interests"
  ON profile_interests FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile interests"
  ON profile_interests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile interests"
  ON profile_interests FOR DELETE
  USING (auth.uid() = user_id);

-- Add interest_count column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interest_count integer DEFAULT 0;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_profile_interests_user ON profile_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_interests_target ON profile_interests(target_profile_id);
