-- Add badges column to profiles and opportunities
-- Supports reusable badge system: sample, hot, new, verified, trending, etc.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'badges'
  ) THEN
    ALTER TABLE profiles ADD COLUMN badges text[] DEFAULT '{}';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'opportunities' AND column_name = 'badges'
  ) THEN
    ALTER TABLE opportunities ADD COLUMN badges text[] DEFAULT '{}';
  END IF;
END $$;
