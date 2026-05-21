-- 해외 스타트업 아이디어 크롤링 시스템 테이블
-- startup_ideas: 해외 스타트업 정보
-- korea_startup_references: 국내 스타트업 참조 (중복 체크용)

-- 1. Startup Ideas 테이블
CREATE TABLE IF NOT EXISTS public.startup_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE NOT NULL,           -- 'producthunt:123', 'ycombinator:company-name'
  source TEXT NOT NULL,                       -- 'producthunt', 'ycombinator', 'crunchbase', 'betalist'
  source_url TEXT NOT NULL,                   -- 원본 URL

  -- 기본 정보
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  category TEXT[] DEFAULT '{}',
  logo_url TEXT,
  website_url TEXT,

  -- 투자/인기도 정보
  funding_stage TEXT,                         -- 'pre_seed', 'seed', 'series_a', 'series_b', 'series_c', 'ipo'
  total_funding DECIMAL(15,2),                -- USD 기준
  investors TEXT[] DEFAULT '{}',
  upvotes INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,

  -- 한국 시장 분석
  korea_fit_score SMALLINT,                   -- AI 분석 (0-100)
  korea_fit_analysis JSONB,                   -- { "reasoning": "...", "opportunities": [...], "challenges": [...] }
  similar_korea_startups TEXT[] DEFAULT '{}', -- 유사 국내 서비스 이름들

  -- 분류/태깅
  interest_tags TEXT[] DEFAULT '{}',          -- AI 자동 태깅
  -- content_embedding vector(2000),          -- 유사도 검색용 (Phase 2: pgvector 활성화 후)
  tier SMALLINT DEFAULT 1,                    -- 데이터 소스 우선순위 (1: 높음)
  priority_score SMALLINT DEFAULT 50,         -- 전체 우선순위 점수 (0-100)

  -- 상태 관리
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'duplicate')),

  -- 메타데이터
  raw_data JSONB,                             -- 원본 API 응답
  collected_at TIMESTAMPTZ DEFAULT NOW(),     -- 수집 시점
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Korea Startup References 테이블 (국내 스타트업 참조)
CREATE TABLE IF NOT EXISTS public.korea_startup_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,                    -- 'disquiet:xxx', 'tips:xxx'
  source TEXT NOT NULL,                       -- 'disquiet', 'tips', 'manual'

  -- 기본 정보
  name TEXT NOT NULL,
  description TEXT,
  category TEXT[] DEFAULT '{}',
  website_url TEXT,

  -- 벡터 검색용 (Phase 2: pgvector 활성화 후)
  -- content_embedding vector(2000),

  -- 메타데이터
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_startup_ideas_source ON public.startup_ideas(source);
CREATE INDEX IF NOT EXISTS idx_startup_ideas_status ON public.startup_ideas(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_startup_ideas_tier ON public.startup_ideas(tier);
CREATE INDEX IF NOT EXISTS idx_startup_ideas_priority ON public.startup_ideas(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_startup_ideas_korea_fit ON public.startup_ideas(korea_fit_score DESC) WHERE korea_fit_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_startup_ideas_category ON public.startup_ideas USING GIN(category);
CREATE INDEX IF NOT EXISTS idx_startup_ideas_interest_tags ON public.startup_ideas USING GIN(interest_tags);
CREATE INDEX IF NOT EXISTS idx_startup_ideas_collected_at ON public.startup_ideas(collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_startup_ideas_created_at ON public.startup_ideas(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_korea_refs_source ON public.korea_startup_references(source);
CREATE INDEX IF NOT EXISTS idx_korea_refs_category ON public.korea_startup_references USING GIN(category);
CREATE INDEX IF NOT EXISTS idx_korea_refs_name ON public.korea_startup_references(name);

-- RLS 정책
ALTER TABLE public.startup_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.korea_startup_references ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 조회 가능 (공개 데이터)
CREATE POLICY "Authenticated users can view startup ideas"
  ON public.startup_ideas FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view korea references"
  ON public.korea_startup_references FOR SELECT
  USING (auth.role() = 'authenticated');

-- 서비스 역할만 CUD 가능 (Cron Job, Admin)
CREATE POLICY "Service role full access startup_ideas"
  ON public.startup_ideas FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access korea_refs"
  ON public.korea_startup_references FOR ALL
  USING (auth.role() = 'service_role');

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_startup_ideas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_startup_ideas_updated_at
  BEFORE UPDATE ON public.startup_ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_startup_ideas_updated_at();

CREATE TRIGGER trigger_korea_refs_updated_at
  BEFORE UPDATE ON public.korea_startup_references
  FOR EACH ROW
  EXECUTE FUNCTION update_startup_ideas_updated_at();

-- 주석
COMMENT ON TABLE public.startup_ideas IS '해외 스타트업 아이디어 수집 데이터';
COMMENT ON COLUMN public.startup_ideas.external_id IS '소스별 고유 ID (예: producthunt:123)';
COMMENT ON COLUMN public.startup_ideas.korea_fit_score IS 'AI 분석 한국 시장 적합성 점수 (0-100)';
COMMENT ON COLUMN public.startup_ideas.tier IS '데이터 소스 우선순위 (1: Product Hunt, YC / 2: BetaList / 3: VC 블로그)';
COMMENT ON COLUMN public.startup_ideas.priority_score IS '종합 우선순위 점수 (투자금+인기도+적합성 가중 합산)';

COMMENT ON TABLE public.korea_startup_references IS '국내 스타트업 참조 데이터 (중복 체크용)';
COMMENT ON COLUMN public.korea_startup_references.external_id IS '소스별 고유 ID (예: disquiet:xxx)';

-- RPC: 우선순위 점수 계산
CREATE OR REPLACE FUNCTION calculate_startup_priority(
  p_upvotes INTEGER,
  p_total_funding DECIMAL,
  p_korea_fit_score SMALLINT,
  p_tier SMALLINT
)
RETURNS SMALLINT
LANGUAGE plpgsql
AS $$
DECLARE
  v_score DECIMAL;
  v_upvote_score DECIMAL;
  v_funding_score DECIMAL;
  v_fit_score DECIMAL;
  v_tier_bonus DECIMAL;
BEGIN
  -- Upvote 점수 (최대 25점, 로그 스케일)
  v_upvote_score := LEAST(25, LOG(GREATEST(p_upvotes, 1) + 1) * 5);

  -- 펀딩 점수 (최대 25점, 로그 스케일)
  v_funding_score := LEAST(25, LOG(GREATEST(p_total_funding, 1) + 1) * 2);

  -- 한국 적합성 점수 (최대 40점)
  v_fit_score := COALESCE(p_korea_fit_score, 50) * 0.4;

  -- Tier 보너스 (Tier 1: +10, Tier 2: +5, Tier 3: +2, Tier 4: 0)
  v_tier_bonus := CASE
    WHEN p_tier = 1 THEN 10
    WHEN p_tier = 2 THEN 5
    WHEN p_tier = 3 THEN 2
    ELSE 0
  END;

  v_score := v_upvote_score + v_funding_score + v_fit_score + v_tier_bonus;

  RETURN LEAST(100, GREATEST(0, v_score))::SMALLINT;
END;
$$;
