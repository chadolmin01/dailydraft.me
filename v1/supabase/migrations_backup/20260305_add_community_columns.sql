-- Add community-related columns to opportunities table
-- Phase 2: Project Feed Enhancement

-- Add pain_point column for project challenges/questions
ALTER TABLE public.opportunities
ADD COLUMN IF NOT EXISTS pain_point TEXT;

-- Add interest_count column to track how many people expressed interest
ALTER TABLE public.opportunities
ADD COLUMN IF NOT EXISTS interest_count INTEGER DEFAULT 0;

-- Add index for sorting by interest_count (popular projects)
CREATE INDEX IF NOT EXISTS idx_opportunities_interest_count
ON public.opportunities(interest_count DESC);

-- Add comments
COMMENT ON COLUMN public.opportunities.pain_point IS 'Project pain point or challenge that needs feedback';
COMMENT ON COLUMN public.opportunities.interest_count IS 'Number of users who expressed interest in this project';
