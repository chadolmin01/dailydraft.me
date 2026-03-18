-- 해외 스타트업 한국 시장 심층 분석 컬럼 추가
-- korea_deep_analysis: Gemini AI 심층 분석 결과
-- final_score: 가중치 기반 최종 점수

-- 1. 새 컬럼 추가
ALTER TABLE public.startup_ideas
ADD COLUMN IF NOT EXISTS korea_deep_analysis JSONB,
ADD COLUMN IF NOT EXISTS final_score SMALLINT;

-- 2. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_startup_ideas_final_score
  ON public.startup_ideas(final_score DESC NULLS LAST)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_startup_ideas_deep_analysis
  ON public.startup_ideas USING GIN(korea_deep_analysis)
  WHERE korea_deep_analysis IS NOT NULL;

-- 3. 최종 점수 계산 RPC 함수
-- 최종 점수 = (korea_fit_score × 0.4) + (upvotes_normalized × 0.3) +
--             (no_competitor_bonus × 0.2) + (easy_difficulty_bonus × 0.1)
CREATE OR REPLACE FUNCTION calculate_final_score(
  p_korea_fit_score SMALLINT,
  p_upvotes INTEGER,
  p_korea_exists BOOLEAN,
  p_difficulty TEXT
)
RETURNS SMALLINT
LANGUAGE plpgsql
AS $$
DECLARE
  v_korea_fit_component DECIMAL;
  v_upvotes_normalized DECIMAL;
  v_no_competitor_bonus DECIMAL;
  v_difficulty_bonus DECIMAL;
  v_final_score DECIMAL;
BEGIN
  -- 1. 한국 적합도 점수 (40%)
  v_korea_fit_component := COALESCE(p_korea_fit_score, 50) * 0.4;

  -- 2. Upvotes 정규화 (30%) - log10 정규화, 최대 30점
  -- upvotes: 0 -> 0, 10 -> 10, 100 -> 20, 1000 -> 30
  v_upvotes_normalized := CASE
    WHEN p_upvotes > 0 THEN LEAST(30, LOG(p_upvotes) * 10)
    ELSE 0
  END;

  -- 3. 경쟁자 없음 보너스 (20%)
  v_no_competitor_bonus := CASE
    WHEN p_korea_exists = false THEN 20
    ELSE 0
  END;

  -- 4. 난이도 보너스 (10%)
  v_difficulty_bonus := CASE
    WHEN p_difficulty = 'easy' THEN 10
    WHEN p_difficulty = 'medium' THEN 5
    ELSE 0
  END;

  v_final_score := v_korea_fit_component + v_upvotes_normalized + v_no_competitor_bonus + v_difficulty_bonus;

  RETURN LEAST(100, GREATEST(0, v_final_score))::SMALLINT;
END;
$$;

-- 4. 분석된 스타트업의 final_score 업데이트 RPC
CREATE OR REPLACE FUNCTION update_startup_final_scores()
RETURNS TABLE (
  updated_count INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  WITH updated AS (
    UPDATE public.startup_ideas
    SET final_score = calculate_final_score(
      korea_fit_score,
      upvotes,
      (korea_deep_analysis->>'korea_exists')::BOOLEAN,
      korea_deep_analysis->>'difficulty'
    )
    WHERE korea_deep_analysis IS NOT NULL
      AND status = 'active'
    RETURNING 1
  )
  SELECT COUNT(*)::INTEGER INTO v_updated FROM updated;

  RETURN QUERY SELECT v_updated;
END;
$$;

-- 5. 상위 스타트업 조회 RPC (정렬 옵션 포함)
CREATE OR REPLACE FUNCTION get_top_startup_ideas(
  p_limit INTEGER DEFAULT 10,
  p_sort TEXT DEFAULT 'final_score'
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  tagline TEXT,
  description TEXT,
  category TEXT[],
  logo_url TEXT,
  website_url TEXT,
  source TEXT,
  source_url TEXT,
  upvotes INTEGER,
  korea_fit_score SMALLINT,
  final_score SMALLINT,
  korea_deep_analysis JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    si.id,
    si.name,
    si.tagline,
    si.description,
    si.category,
    si.logo_url,
    si.website_url,
    si.source,
    si.source_url,
    si.upvotes,
    si.korea_fit_score,
    si.final_score,
    si.korea_deep_analysis
  FROM public.startup_ideas si
  WHERE si.status = 'active'
    AND si.korea_deep_analysis IS NOT NULL
  ORDER BY
    CASE
      WHEN p_sort = 'final_score' THEN si.final_score
      WHEN p_sort = 'korea_fit_score' THEN si.korea_fit_score
      WHEN p_sort = 'upvotes' THEN si.upvotes
      ELSE si.final_score
    END DESC NULLS LAST
  LIMIT p_limit;
END;
$$;

-- 주석 추가
COMMENT ON COLUMN public.startup_ideas.korea_deep_analysis IS 'Gemini AI 심층 분석 결과 (korean_summary, problem, business_model, korea_exists, korea_competitors, korea_fit_score, korea_fit_reason, suggested_localization, target_founder_type, difficulty, tags)';
COMMENT ON COLUMN public.startup_ideas.final_score IS '가중치 기반 최종 점수 (0-100): korea_fit×0.4 + upvotes×0.3 + no_competitor×0.2 + easy_difficulty×0.1';
COMMENT ON FUNCTION calculate_final_score IS '스타트업 최종 점수 계산 함수';
COMMENT ON FUNCTION update_startup_final_scores IS '모든 분석된 스타트업의 final_score 일괄 업데이트';
COMMENT ON FUNCTION get_top_startup_ideas IS '상위 스타트업 조회 (정렬 옵션: final_score, korea_fit_score, upvotes)';
