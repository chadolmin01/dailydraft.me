-- opportunities 테이블에 profiles foreign key 추가
-- creator_id -> profiles.user_id 연결

-- 먼저 opportunities 테이블이 없으면 생성
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  location TEXT,
  location_type TEXT,
  time_commitment TEXT,
  compensation_type TEXT,
  compensation_details TEXT,
  needed_roles TEXT[],
  needed_skills JSONB,
  interest_tags TEXT[],
  project_links JSONB,
  demo_images TEXT[],
  views_count INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0,
  vision_embedding TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- profiles 테이블이 없으면 생성
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  nickname TEXT NOT NULL,
  university TEXT,
  major TEXT,
  graduation_year INTEGER,
  location TEXT,
  age_range TEXT,
  current_situation TEXT,
  desired_position TEXT,
  skills JSONB,
  personality JSONB,
  interest_tags TEXT[],
  vision_summary TEXT,
  vision_embedding TEXT,
  contact_email TEXT,
  contact_kakao TEXT,
  profile_visibility TEXT DEFAULT 'public',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  ai_chat_completed BOOLEAN DEFAULT FALSE,
  ai_chat_transcript JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Foreign key 추가 (이미 있으면 무시)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'opportunities_creator_id_fkey'
    AND table_name = 'opportunities'
  ) THEN
    ALTER TABLE opportunities
    ADD CONSTRAINT opportunities_creator_id_fkey
    FOREIGN KEY (creator_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_opportunities_creator_id ON opportunities(creator_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- RLS
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 기본 RLS 정책 (이미 있으면 무시)
DO $$
BEGIN
  -- opportunities: 누구나 조회 가능, 본인만 수정
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view opportunities') THEN
    CREATE POLICY "Anyone can view opportunities" ON opportunities FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own opportunities') THEN
    CREATE POLICY "Users can manage own opportunities" ON opportunities FOR ALL USING (auth.uid() = creator_id);
  END IF;

  -- profiles: 누구나 조회 가능, 본인만 수정
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view profiles') THEN
    CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own profile') THEN
    CREATE POLICY "Users can manage own profile" ON profiles FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
