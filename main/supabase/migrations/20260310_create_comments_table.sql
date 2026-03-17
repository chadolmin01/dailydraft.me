-- Phase 3: Community Feedback - Comments System
-- This migration creates the comments, helpful_votes, and comment_reports tables

-- Comments table for project feedback
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  school TEXT,
  content TEXT NOT NULL,
  helpful_count INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_hidden BOOLEAN DEFAULT FALSE,
  report_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for comments
CREATE INDEX idx_comments_opportunity_id ON public.comments(opportunity_id);
CREATE INDEX idx_comments_helpful ON public.comments(helpful_count DESC);
CREATE INDEX idx_comments_created_at ON public.comments(created_at DESC);

-- RLS for comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read non-hidden comments" ON public.comments
  FOR SELECT USING (is_hidden = FALSE);
CREATE POLICY "Anyone can insert comments" ON public.comments
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Helpful votes table for duplicate prevention
CREATE TABLE public.helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  voter_identifier TEXT NOT NULL,  -- user_id or anonymous fingerprint
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comment_id, voter_identifier)
);

-- RLS for helpful_votes
ALTER TABLE public.helpful_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read votes" ON public.helpful_votes FOR SELECT USING (true);
CREATE POLICY "Anyone can vote" ON public.helpful_votes FOR INSERT WITH CHECK (true);

-- Comment reports table for moderation
CREATE TABLE public.comment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  reporter_identifier TEXT NOT NULL,  -- user_id or anonymous fingerprint
  reason TEXT,  -- 'spam', 'abuse', 'inappropriate', etc.
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comment_id, reporter_identifier)
);

-- RLS for comment_reports
ALTER TABLE public.comment_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can report" ON public.comment_reports FOR INSERT WITH CHECK (true);

-- RPC: Vote helpful (atomic operation)
CREATE OR REPLACE FUNCTION vote_helpful(
  p_comment_id UUID,
  p_voter_identifier TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Try to insert vote (will fail if already voted due to unique constraint)
  INSERT INTO public.helpful_votes (comment_id, voter_identifier)
  VALUES (p_comment_id, p_voter_identifier);

  -- Increment helpful count
  UPDATE public.comments
  SET helpful_count = helpful_count + 1
  WHERE id = p_comment_id;

  RETURN TRUE;
EXCEPTION
  WHEN unique_violation THEN
    RETURN FALSE;  -- Already voted
END;
$$;

-- RPC: Report comment (auto-hide if 3+ reports)
CREATE OR REPLACE FUNCTION report_comment(
  p_comment_id UUID,
  p_reporter_identifier TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Try to insert report
  INSERT INTO public.comment_reports (comment_id, reporter_identifier, reason)
  VALUES (p_comment_id, p_reporter_identifier, p_reason);

  -- Increment report count
  UPDATE public.comments
  SET report_count = report_count + 1
  WHERE id = p_comment_id;

  -- Auto-hide if 3+ reports
  UPDATE public.comments
  SET is_hidden = TRUE
  WHERE id = p_comment_id AND report_count >= 3;

  RETURN TRUE;
EXCEPTION
  WHEN unique_violation THEN
    RETURN FALSE;  -- Already reported
END;
$$;

-- Comments
COMMENT ON TABLE public.comments IS 'User feedback/comments on projects';
COMMENT ON TABLE public.helpful_votes IS 'Tracks helpful votes to prevent duplicates';
COMMENT ON TABLE public.comment_reports IS 'Tracks comment reports for moderation';
