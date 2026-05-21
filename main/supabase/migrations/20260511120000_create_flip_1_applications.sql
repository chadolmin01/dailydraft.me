-- FLIP 1기 AI 빌더 스터디 사전 신청 테이블
-- 익명 사용자가 INSERT만 가능, 조회는 service_role만 (Supabase Studio에서 확인)
-- 기존 recruit_applications (Draft 1기 모집) 와는 별도 테이블로 분리하여 과거 데이터 보존

CREATE TABLE IF NOT EXISTS public.flip_1_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),

  -- 섹션 1. 기본 정보
  name text NOT NULL,                                                                            -- Q1
  team_name text NOT NULL,                                                                       -- Q2 (직접 입력)
  team_role text NOT NULL CHECK (team_role IN ('leader', 'member')),                             -- Q3

  -- 섹션 2. AI 관심·태도
  ai_content_freq text NOT NULL CHECK (ai_content_freq IN ('rarely', 'monthly', 'weekly', 'daily')),  -- Q4
  ai_recent_use text NOT NULL,                                                                   -- Q5
  ai_build_attitude text NOT NULL CHECK (
    ai_build_attitude IN ('no_interest', 'interested_far', 'want_start', 'trying', 'actively')
  ),                                                                                             -- Q6
  willingness smallint NOT NULL CHECK (willingness BETWEEN 1 AND 5),                             -- Q7

  -- 섹션 3. AI/개발 경험
  experience text[] NOT NULL DEFAULT '{}',                                                       -- Q8 (다중 선택)
  self_skill smallint NOT NULL CHECK (self_skill BETWEEN 1 AND 5),                               -- Q9
  recent_build text,                                                                             -- Q10 (선택)

  -- 섹션 4. AI 도구 사용 & 비용
  paid_tools text[] NOT NULL DEFAULT '{}',                                                       -- Q11 (다중 선택)
  paid_tools_other text,                                                                         -- Q11 "기타" 직접 입력
  monthly_spend text NOT NULL CHECK (
    monthly_spend IN ('0', 'lt1', '1_3', '3_6', '6_10', '10plus')
  ),                                                                                             -- Q12
  claude_status text NOT NULL CHECK (
    claude_status IN ('paid_want_subsidy', 'paid_ok', 'unpaid_self', 'unpaid_want_subsidy', 'unsure')
  ),                                                                                             -- Q13

  -- 섹션 5. 팀 자산 & 스터디 목표
  team_asset_status text NOT NULL CHECK (
    team_asset_status IN ('none', 'idea', 'wip', 'has_url', 'almost_done')
  ),                                                                                             -- Q14
  desired_outcome text NOT NULL CHECK (
    desired_outcome IN ('landing', 'mvp_feature', 'preorder_data', 'experience', 'founder_proof', 'other')
  ),                                                                                             -- Q15
  desired_outcome_other text,                                                                    -- Q15 "기타" 직접 입력
  ai_feature_idea text,                                                                          -- Q16 (선택)

  -- 섹션 6. 운영
  attendance text NOT NULL CHECK (attendance IN ('all_6', '5', 'lt_4', 'unsure')),               -- Q17
  available_slots text[] NOT NULL DEFAULT '{}',                                                  -- Q18 (다중 선택)
  has_laptop boolean NOT NULL,                                                                   -- Q19
  notes text,                                                                                    -- Q20 (선택)

  -- 동의 & 메타
  agreed_at timestamptz NOT NULL,
  user_agent text,
  cohort text NOT NULL DEFAULT 'flip-1-ai-builder'
);

CREATE INDEX IF NOT EXISTS idx_flip_1_applications_created_at
  ON public.flip_1_applications (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_flip_1_applications_cohort
  ON public.flip_1_applications (cohort);

CREATE INDEX IF NOT EXISTS idx_flip_1_applications_team_name
  ON public.flip_1_applications (team_name);

-- RLS 활성화
ALTER TABLE public.flip_1_applications ENABLE ROW LEVEL SECURITY;

-- 익명 사용자 INSERT 허용 (사전 신청 폼 제출용)
-- 의도: 폼이 로그인 없이 동작해야 하므로 anon role insert 허용.
--      SELECT 정책은 일부러 생략 → service_role만 조회 가능 → 개인정보 보호.
DROP POLICY IF EXISTS "anon can insert flip 1 applications" ON public.flip_1_applications;
CREATE POLICY "anon can insert flip 1 applications"
  ON public.flip_1_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

COMMENT ON TABLE public.flip_1_applications IS 'FLIP 1기 AI 빌더 스터디 사전 신청. 어드민은 service_role로만 조회.';
