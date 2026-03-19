-- PRD Validator 사용량 추적 테이블
CREATE TABLE IF NOT EXISTS prd_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('sketch', 'mvp', 'defense')),
  validation_id UUID,
  score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_prd_usage_email ON prd_usage(user_email);
CREATE INDEX IF NOT EXISTS idx_prd_usage_level ON prd_usage(level);
CREATE INDEX IF NOT EXISTS idx_prd_usage_created_at ON prd_usage(created_at DESC);

-- 이번 달 사용량 계산을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_prd_usage_email_level_month ON prd_usage(user_email, level, created_at);

-- RLS 정책
ALTER TABLE prd_usage ENABLE ROW LEVEL SECURITY;

-- 누구나 INSERT 가능
CREATE POLICY "Anyone can insert prd_usage"
  ON prd_usage
  FOR INSERT
  WITH CHECK (true);

-- 누구나 SELECT 가능
CREATE POLICY "Anyone can view prd_usage"
  ON prd_usage
  FOR SELECT
  USING (true);

-- 사용량 확인 함수: 이번 달 레벨별 사용 횟수
CREATE OR REPLACE FUNCTION get_prd_usage_this_month(p_email TEXT)
RETURNS TABLE (
  level TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.level,
    COUNT(*)::BIGINT
  FROM prd_usage u
  WHERE u.user_email = p_email
    AND u.created_at >= date_trunc('month', NOW())
  GROUP BY u.level;
END;
$$ LANGUAGE plpgsql;

-- Defense 해금 조건 확인 함수: MVP 80점 이상 달성 여부
CREATE OR REPLACE FUNCTION check_defense_unlock(p_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM prd_usage
    WHERE user_email = p_email
      AND level = 'mvp'
      AND score >= 80
  );
END;
$$ LANGUAGE plpgsql;
