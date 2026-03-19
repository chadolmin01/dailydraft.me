-- Session Analytics: 익명화된 세션 데이터 수집
-- wrapper 탈출을 위한 proprietary data flywheel

CREATE TABLE IF NOT EXISTS session_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),

  -- 익명화: user_id 저장하지 않음, 세션 해시만 저장
  session_hash TEXT NOT NULL,

  -- 세션 메타데이터
  validation_level TEXT CHECK (validation_level IN ('SKETCH', 'MVP', 'DEFENSE')),
  total_turns INT DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  dropped_at_turn INT,  -- 이탈한 턴 (completed=false일 때만)

  -- 아이디어 카테고리 (원문 저장 안함, 프라이버시 보호)
  idea_category TEXT[] DEFAULT '{}',
  idea_word_count INT DEFAULT 0,

  -- 점수 추이
  score_history JSONB DEFAULT '[]',
  -- 예: [{"turn": 1, "scores": {"feasibility": 60, "market": 70, "tech": 80}}]

  final_score JSONB,
  -- 예: {"score": 72, "vcScore": 70, "developerScore": 75, "designerScore": 68}

  -- 조언 반영 패턴
  advice_shown INT DEFAULT 0,
  advice_reflected INT DEFAULT 0,
  reflected_categories TEXT[] DEFAULT '{}',
  -- 예: ['problem', 'team', 'market', 'tech', 'ux']

  -- 페르소나별 참여도
  persona_engagement JSONB DEFAULT '{}',
  -- 예: {"Developer": 3, "Designer": 2, "VC": 5}

  -- 외부 스타트업 연동 여부
  from_startup_idea BOOLEAN DEFAULT false,
  startup_source TEXT  -- 'producthunt', 'ycombinator' 등
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_session_analytics_level
  ON session_analytics(validation_level);
CREATE INDEX IF NOT EXISTS idx_session_analytics_category
  ON session_analytics USING GIN(idea_category);
CREATE INDEX IF NOT EXISTS idx_session_analytics_completed
  ON session_analytics(completed);
CREATE INDEX IF NOT EXISTS idx_session_analytics_created
  ON session_analytics(created_at DESC);

-- RLS 활성화
ALTER TABLE session_analytics ENABLE ROW LEVEL SECURITY;

-- 정책: 로그인한 사용자만 삽입 가능 (스팸/공격 방지)
CREATE POLICY "Authenticated users can insert"
  ON session_analytics
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 정책: 조회는 service_role만 가능 (분석용)
CREATE POLICY "Service role can select"
  ON session_analytics
  FOR SELECT
  USING (auth.role() = 'service_role');

-- 집계 쿼리용 RPC (나중에 사용)
CREATE OR REPLACE FUNCTION get_session_analytics_summary(
  p_days INT DEFAULT 30
)
RETURNS TABLE (
  total_sessions BIGINT,
  completed_sessions BIGINT,
  completion_rate NUMERIC,
  avg_turns NUMERIC,
  top_categories TEXT[],
  avg_final_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_sessions,
    COUNT(*) FILTER (WHERE completed)::BIGINT as completed_sessions,
    ROUND(
      COUNT(*) FILTER (WHERE completed)::NUMERIC / NULLIF(COUNT(*), 0) * 100,
      1
    ) as completion_rate,
    ROUND(AVG(total_turns)::NUMERIC, 1) as avg_turns,
    (
      SELECT ARRAY_AGG(cat ORDER BY cnt DESC)
      FROM (
        SELECT unnest(idea_category) as cat, COUNT(*) as cnt
        FROM session_analytics
        WHERE created_at > now() - (p_days || ' days')::INTERVAL
        GROUP BY cat
        LIMIT 5
      ) sub
    ) as top_categories,
    ROUND(AVG((final_score->>'score')::NUMERIC), 1) as avg_final_score
  FROM session_analytics
  WHERE created_at > now() - (p_days || ' days')::INTERVAL;
END;
$$;

COMMENT ON TABLE session_analytics IS '익명화된 세션 분석 데이터 - wrapper 탈출을 위한 proprietary data';
