-- Migration: Add invite codes system for premium access
-- Date: 2025-02-18

-- Add premium columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS premium_activated_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invite_code_used VARCHAR(8);

-- Create invite_codes table
CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(8) UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  recipient_email VARCHAR(255),
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_recipient ON invite_codes(recipient_email);
CREATE INDEX IF NOT EXISTS idx_invite_codes_active ON invite_codes(is_active, expires_at);

-- Create index for premium users lookup
CREATE INDEX IF NOT EXISTS idx_profiles_premium ON profiles(is_premium) WHERE is_premium = true;

-- RLS policies for invite_codes
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage invite codes
CREATE POLICY "Admins can manage invite codes" ON invite_codes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Allow users to read their own used invite code
CREATE POLICY "Users can view their used invite code" ON invite_codes
  FOR SELECT
  USING (used_by = auth.uid());

-- Allow users to use (update) invite codes that are active and not expired
CREATE POLICY "Users can redeem active invite codes" ON invite_codes
  FOR UPDATE
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND used_by IS NULL
  )
  WITH CHECK (
    used_by = auth.uid()
  );

-- Comments
COMMENT ON TABLE invite_codes IS 'Invite codes for premium access before payment integration';
COMMENT ON COLUMN invite_codes.code IS 'Random 8-character alphanumeric code (e.g., ABC12DEF)';
COMMENT ON COLUMN invite_codes.created_by IS 'Admin who created the invite code';
COMMENT ON COLUMN invite_codes.recipient_email IS 'Email address the invite was sent to';
COMMENT ON COLUMN invite_codes.used_by IS 'User who redeemed the code';
COMMENT ON COLUMN invite_codes.used_at IS 'Timestamp when code was redeemed';
COMMENT ON COLUMN invite_codes.expires_at IS 'Code expiration date (30 days from creation)';
COMMENT ON COLUMN invite_codes.is_active IS 'Whether code can still be used';

COMMENT ON COLUMN profiles.is_premium IS 'Whether user has premium access';
COMMENT ON COLUMN profiles.premium_activated_at IS 'When premium access was activated';
COMMENT ON COLUMN profiles.invite_code_used IS 'Invite code used to activate premium';
