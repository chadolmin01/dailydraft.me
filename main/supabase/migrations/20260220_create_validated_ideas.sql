-- Create validated_ideas table for storing AI-validated project ideas
CREATE TABLE IF NOT EXISTS public.validated_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_idea TEXT NOT NULL,
  conversation_history TEXT,
  reflected_advice TEXT[] DEFAULT '{}',
  artifacts JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_validated_ideas_user_id ON public.validated_ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_validated_ideas_created_at ON public.validated_ideas(created_at DESC);

-- Enable RLS
ALTER TABLE public.validated_ideas ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own validated ideas" ON public.validated_ideas;
DROP POLICY IF EXISTS "Users can create own validated ideas" ON public.validated_ideas;
DROP POLICY IF EXISTS "Users can update own validated ideas" ON public.validated_ideas;
DROP POLICY IF EXISTS "Users can delete own validated ideas" ON public.validated_ideas;

-- Users can only see their own validated ideas
CREATE POLICY "Users can view own validated ideas"
  ON public.validated_ideas
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own validated ideas
CREATE POLICY "Users can create own validated ideas"
  ON public.validated_ideas
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own validated ideas
CREATE POLICY "Users can update own validated ideas"
  ON public.validated_ideas
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own validated ideas
CREATE POLICY "Users can delete own validated ideas"
  ON public.validated_ideas
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_validated_ideas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validated_ideas_updated_at
  BEFORE UPDATE ON public.validated_ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_validated_ideas_updated_at();

-- Comments for documentation
COMMENT ON TABLE public.validated_ideas IS 'Stores AI-validated project ideas from Idea Validator';
COMMENT ON COLUMN public.validated_ideas.project_idea IS 'The main project idea text';
COMMENT ON COLUMN public.validated_ideas.conversation_history IS 'Full conversation history with AI validator';
COMMENT ON COLUMN public.validated_ideas.reflected_advice IS 'Array of advice/insights from AI validation';
COMMENT ON COLUMN public.validated_ideas.artifacts IS 'Generated artifacts like PRD, JD in JSON format: {prd?: string, jd?: string}';
