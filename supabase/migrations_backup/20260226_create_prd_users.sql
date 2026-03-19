-- PRD Validator 사용자 테이블
CREATE TABLE IF NOT EXISTS prd_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  organization TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  privacy_consent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_prd_users_email ON prd_users(email);
CREATE INDEX IF NOT EXISTS idx_prd_users_created_at ON prd_users(created_at DESC);

-- RLS 정책
ALTER TABLE prd_users ENABLE ROW LEVEL SECURITY;

-- 누구나 INSERT 가능 (온보딩용)
CREATE POLICY "Anyone can insert prd_users"
  ON prd_users
  FOR INSERT
  WITH CHECK (true);

-- 누구나 SELECT 가능
CREATE POLICY "Anyone can view prd_users"
  ON prd_users
  FOR SELECT
  USING (true);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_prd_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prd_users_updated_at ON prd_users;
CREATE TRIGGER trigger_prd_users_updated_at
  BEFORE UPDATE ON prd_users
  FOR EACH ROW
  EXECUTE FUNCTION update_prd_users_updated_at();
