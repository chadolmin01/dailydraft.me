-- Add is_admin column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index for faster admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;

-- Update error_logs RLS policy to only allow admins
DROP POLICY IF EXISTS "Authenticated users can read error logs" ON error_logs;
DROP POLICY IF EXISTS "Admins can read error logs" ON error_logs;

CREATE POLICY "Admins can read error logs"
ON error_logs FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.is_admin = true
    )
);

-- Comment
COMMENT ON COLUMN profiles.is_admin IS 'Whether the user has admin privileges';
