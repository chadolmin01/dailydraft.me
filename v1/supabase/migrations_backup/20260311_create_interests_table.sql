-- Phase 3: Community Feedback - Interests System
-- This migration creates the interests table for tracking user interest in projects

-- Interests table
CREATE TABLE public.interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(opportunity_id, user_email)
);

-- Indexes for interests
CREATE INDEX idx_interests_opportunity_id ON public.interests(opportunity_id);
CREATE INDEX idx_interests_user_id ON public.interests(user_id);

-- RLS for interests
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read interests" ON public.interests FOR SELECT USING (true);
CREATE POLICY "Anyone can express interest" ON public.interests FOR INSERT WITH CHECK (true);

-- RPC: Express interest (atomic operation with count increment)
CREATE OR REPLACE FUNCTION express_interest(
  p_opportunity_id UUID,
  p_user_email TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Try to insert interest (will fail if already interested due to unique constraint)
  INSERT INTO public.interests (opportunity_id, user_email, user_id)
  VALUES (p_opportunity_id, p_user_email, p_user_id);

  -- Increment interest count on opportunity
  UPDATE public.opportunities
  SET interest_count = COALESCE(interest_count, 0) + 1
  WHERE id = p_opportunity_id;

  RETURN TRUE;
EXCEPTION
  WHEN unique_violation THEN
    RETURN FALSE;  -- Already expressed interest
END;
$$;

-- RPC: Check if user has expressed interest
CREATE OR REPLACE FUNCTION has_expressed_interest(
  p_opportunity_id UUID,
  p_user_email TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.interests
    WHERE opportunity_id = p_opportunity_id AND user_email = p_user_email
  );
END;
$$;

-- Comments
COMMENT ON TABLE public.interests IS 'Tracks users who expressed interest in projects';
