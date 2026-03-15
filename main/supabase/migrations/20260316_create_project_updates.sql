-- 프로젝트 주간 업데이트 테이블
CREATE TABLE IF NOT EXISTS project_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  update_type TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT project_updates_type_check CHECK (update_type IN ('ideation', 'design', 'development', 'launch', 'general'))
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_project_updates_opportunity ON project_updates(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_project_updates_author ON project_updates(author_id);

-- RLS
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;

-- 누구나 조회 가능
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view project updates') THEN
    CREATE POLICY "Anyone can view project updates" ON project_updates FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own project updates') THEN
    CREATE POLICY "Users can manage own project updates" ON project_updates FOR ALL USING (auth.uid() = author_id);
  END IF;
END $$;
