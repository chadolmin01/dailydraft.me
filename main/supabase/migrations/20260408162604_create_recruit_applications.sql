-- Draft 1기 모집 지원서 테이블
-- 익명 사용자가 INSERT만 가능, 조회는 service_role만 (어드민은 Supabase Studio에서 확인)

CREATE TABLE IF NOT EXISTS public.recruit_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),

  -- 기본 정보
  name text NOT NULL,
  kakao_id text NOT NULL,

  -- 팀 정보
  team_idea text NOT NULL,
  team_role text NOT NULL CHECK (team_role IN ('plan', 'design', 'dev', 'etc')),

  -- 자기소개
  ai_experience text NOT NULL,
  learning_goal text NOT NULL,
  motivation text NOT NULL,

  -- 가용성
  available_slots text[] NOT NULL DEFAULT '{}',
  weekly_hours text NOT NULL CHECK (weekly_hours IN ('3-5', '5-8', '8+')),
  offline_available text NOT NULL CHECK (offline_available IN ('yes', 'discuss')),

  -- 동의
  agreed_at timestamptz NOT NULL,

  -- 메타
  user_agent text,
  cohort text NOT NULL DEFAULT 'draft-1'
);

CREATE INDEX IF NOT EXISTS idx_recruit_applications_created_at
  ON public.recruit_applications (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recruit_applications_cohort
  ON public.recruit_applications (cohort);

-- RLS 활성화
ALTER TABLE public.recruit_applications ENABLE ROW LEVEL SECURITY;

-- 익명 사용자 INSERT 허용 (모집 폼 제출용)
DROP POLICY IF EXISTS "anon can insert recruit applications" ON public.recruit_applications;
CREATE POLICY "anon can insert recruit applications"
  ON public.recruit_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- SELECT 정책 없음 → service_role만 조회 가능 (Supabase Studio에서 확인)

COMMENT ON TABLE public.recruit_applications IS 'Draft 1기 등 기수별 모집 지원서. 어드민은 service_role로만 조회.';
