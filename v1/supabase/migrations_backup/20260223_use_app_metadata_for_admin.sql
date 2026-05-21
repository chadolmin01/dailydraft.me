-- Migration: Use app_metadata for admin check instead of profiles.is_admin
-- Date: 2026-02-23
--
-- This migration updates RLS policies to use auth.jwt() -> 'app_metadata' -> 'is_admin'
-- instead of checking the profiles.is_admin column.
--
-- Benefits:
-- - Admin status is included in JWT token (no extra DB query)
-- - More secure (only settable via Admin API with service_role key)
-- - Better performance

-- Update invite_codes RLS policy
DROP POLICY IF EXISTS "Admins can manage invite codes" ON invite_codes;

CREATE POLICY "Admins can manage invite codes" ON invite_codes
  FOR ALL
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
  );

-- Update error_logs RLS policy
DROP POLICY IF EXISTS "Admins can read error logs" ON error_logs;

CREATE POLICY "Admins can read error logs" ON error_logs
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
  );

-- Note: profiles.is_admin column is kept for backwards compatibility
-- but is no longer used for authorization checks.
-- You can optionally drop it later:
-- ALTER TABLE profiles DROP COLUMN IF EXISTS is_admin;

COMMENT ON COLUMN profiles.is_admin IS 'DEPRECATED: Use auth.users.app_metadata.is_admin instead';
