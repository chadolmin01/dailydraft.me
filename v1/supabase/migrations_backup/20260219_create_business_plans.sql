-- Create business_plans table for storing government support business plan forms
CREATE TABLE IF NOT EXISTS public.business_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL CHECK (template_type IN ('yebi-chogi', 'student-300', 'saengae-chungnyeon', 'oneul-jeongtong', 'gyeonggi-g-star')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed')),
  title TEXT,
  basic_info JSONB,
  problem_data JSONB,
  solution_data JSONB,
  scaleup_data JSONB,
  team_data JSONB,
  extra_sections JSONB,
  validation_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_business_plans_user_id ON public.business_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_business_plans_status ON public.business_plans(status);
CREATE INDEX IF NOT EXISTS idx_business_plans_template_type ON public.business_plans(template_type);

-- Enable RLS
ALTER TABLE public.business_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own business plans
CREATE POLICY "Users can view own business plans"
  ON public.business_plans
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own business plans
CREATE POLICY "Users can create own business plans"
  ON public.business_plans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own business plans
CREATE POLICY "Users can update own business plans"
  ON public.business_plans
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own business plans
CREATE POLICY "Users can delete own business plans"
  ON public.business_plans
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_business_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_business_plans_updated_at
  BEFORE UPDATE ON public.business_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_business_plans_updated_at();

-- Comments for documentation
COMMENT ON TABLE public.business_plans IS 'Stores user business plans for government support programs';
COMMENT ON COLUMN public.business_plans.template_type IS 'Type of form template: yebi-chogi (예비/초기창업패키지), student-300 (학생창업유망팀300), saengae-chungnyeon (생애최초청년창업), oneul-jeongtong (오늘전통), gyeonggi-g-star (경기G스타오디션)';
COMMENT ON COLUMN public.business_plans.basic_info IS 'Basic information: itemName, oneLiner, targetCustomer, industry, fundingAmount';
COMMENT ON COLUMN public.business_plans.problem_data IS 'PSST Problem section data';
COMMENT ON COLUMN public.business_plans.solution_data IS 'PSST Solution section data';
COMMENT ON COLUMN public.business_plans.scaleup_data IS 'PSST Scale-up section data';
COMMENT ON COLUMN public.business_plans.team_data IS 'PSST Team section data';
COMMENT ON COLUMN public.business_plans.extra_sections IS 'Additional sections specific to template type (e.g., business_canvas, cooperation, etc.)';
COMMENT ON COLUMN public.business_plans.validation_score IS 'PSST validation score out of 100';
