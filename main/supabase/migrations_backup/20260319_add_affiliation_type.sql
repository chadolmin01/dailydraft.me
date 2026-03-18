-- Add affiliation_type column to profiles
-- Supports: student, graduate, professional, freelancer, other
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS affiliation_type text DEFAULT 'student';
