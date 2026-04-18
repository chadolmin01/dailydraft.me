-- ============================================================
-- Output Bundles (R3.1)
-- ============================================================
-- R3 Output Studio의 "번들" 개념 도입:
--   - persona_output_bundles: 단일 이벤트가 여러 채널용 콘텐츠를 묶어 승인·발행되는 단위
--   - club_semester_cycles: 학기 리듬(주차 기반)을 담는 컨텍스트 (R3.1은 테이블만)
--   - persona_channel_credentials: 외부 SNS/이메일 OAuth 토큰 (R3.1은 테이블만, 실제 사용은 R3.4)
--   - persona_outputs에 bundle_id, channel_format, format_constraints 컬럼 추가
--
-- RLS: R1의 can_edit_persona() / can_view_persona() 재활용.
-- ============================================================


-- ============================================================
-- 1. persona_output_bundles
-- ============================================================
-- 하나의 이벤트(예: 주간업데이트·모집시작·쇼케이스) = 하나의 번들.
-- 번들 아래에 여러 persona_outputs (Discord 포스트 + 인스타 캡션 + 에타 공고 등)이 달린다.
CREATE TABLE IF NOT EXISTS persona_output_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN (
    'recruit_teaser',      -- 기수 모집 예고
    'recruit_open',        -- 모집 시작
    'recruit_close',       -- 모집 마감 D-3
    'onboarding',          -- 합격/OT/발대식
    'project_kickoff',     -- 팀 빌딩 공개
    'weekly_update',       -- 주간 업데이트 (R3.1 자동)
    'monthly_recap',       -- 월간 회고
    'mid_showcase',        -- 중간 발표/해커톤
    'sponsor_outreach',    -- 스폰서 영업
    'final_showcase',      -- 학기말 쇼케이스 (R3.1 수동)
    'semester_report',     -- 결과 보고
    'vacation_harvest'     -- 방학 모드 (R3.5)
  )),
  -- 이벤트별 메타데이터. 예: { week_number: 5, cohort: "10-1기", deadline: "2026-03-21" }
  -- 각 이벤트 타입마다 기대하는 필드가 다름. 앱 레이어에서 Zod로 검증.
  event_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'generating'
    CHECK (status IN ('generating', 'pending_approval', 'approved', 'published', 'rejected', 'archived')),
  -- 학기/주차 컨텍스트 (club_semester_cycles 참조는 text key로 느슨하게)
  semester_ref text,            -- 예: '2026-spring'
  week_number int,              -- 학기 주차 (1~16)
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  rejected_reason text,
  published_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_bundles_persona_status
  ON persona_output_bundles(persona_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bundles_event_type
  ON persona_output_bundles(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bundles_semester
  ON persona_output_bundles(semester_ref, week_number) WHERE semester_ref IS NOT NULL;

DROP TRIGGER IF EXISTS trg_bundles_updated_at ON persona_output_bundles;
CREATE TRIGGER trg_bundles_updated_at
  BEFORE UPDATE ON persona_output_bundles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- 2. club_semester_cycles
-- ============================================================
-- 학기 사이클 메타 (클럽별로 등록). 봄학기/가을학기/방학 등.
-- R3.1에선 테이블만 만들고 active 검색은 R3.2에서 UI 연결.
CREATE TABLE IF NOT EXISTS club_semester_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  semester_ref text NOT NULL,         -- '2026-spring', '2026-summer', '2026-fall'
  start_date date NOT NULL,
  end_date date NOT NULL,
  cohort_number text,                 -- '10-1기'
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club_id, semester_ref)
);

CREATE INDEX IF NOT EXISTS idx_semester_cycles_club_active
  ON club_semester_cycles(club_id, is_active) WHERE is_active = true;


-- ============================================================
-- 3. persona_channel_credentials
-- ============================================================
-- 외부 SNS/이메일 OAuth 토큰 저장소. 조직 소유 (회장 교체에도 유지).
-- R3.1에선 스키마만. OAuth 플로우와 encrypted_token 실제 암호화는 R3.4에서.
-- encrypted_token은 Supabase Vault 또는 별도 KMS로 분리 권장 (당장은 서버 환경변수 키로 AES 암호화 가능).
CREATE TABLE IF NOT EXISTS persona_channel_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  channel_type text NOT NULL CHECK (channel_type IN (
    'instagram',
    'threads',
    'x_twitter',
    'linkedin',
    'email_newsletter',
    'discord_webhook',
    'youtube'
  )),
  account_ref text NOT NULL,          -- IG business account id, LinkedIn page id 등
  encrypted_token text,               -- 암호화된 access token
  refresh_token_ref text,             -- Vault secret id (토큰 직접 저장 X)
  scope text[] NOT NULL DEFAULT '{}',
  installed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (persona_id, channel_type, account_ref)
);

CREATE INDEX IF NOT EXISTS idx_channel_creds_persona_active
  ON persona_channel_credentials(persona_id, active) WHERE active = true;

DROP TRIGGER IF EXISTS trg_channel_creds_updated_at ON persona_channel_credentials;
CREATE TRIGGER trg_channel_creds_updated_at
  BEFORE UPDATE ON persona_channel_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- 4. persona_outputs 확장
-- ============================================================
-- 기존 persona_outputs에 번들 연결 + 채널 포맷 메타 추가.
-- bundle_id NULL = 번들 외 단독 출력 (legacy 호환). R3.2에서 모두 번들로 귀속.
ALTER TABLE persona_outputs
  ADD COLUMN IF NOT EXISTS bundle_id uuid REFERENCES persona_output_bundles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS channel_format text,       -- 'discord_forum_markdown', 'instagram_caption' 등
  ADD COLUMN IF NOT EXISTS format_constraints jsonb,  -- { char_limit: 600, hashtag_min: 3, is_copy_only: true }
  ADD COLUMN IF NOT EXISTS is_copy_only boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_persona_outputs_bundle
  ON persona_outputs(bundle_id) WHERE bundle_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_persona_outputs_channel_format
  ON persona_outputs(channel_format);


-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE persona_output_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_semester_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_channel_credentials ENABLE ROW LEVEL SECURITY;

-- persona_output_bundles
-- select: can_view_persona()와 유사. status='published' 공개 + 편집자는 전체.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'bundles_select') THEN
    CREATE POLICY bundles_select ON persona_output_bundles FOR SELECT
      USING (
        status = 'published'
        OR can_edit_persona(persona_id, auth.uid())
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'bundles_write') THEN
    CREATE POLICY bundles_write ON persona_output_bundles FOR ALL
      USING (can_edit_persona(persona_id, auth.uid()))
      WITH CHECK (can_edit_persona(persona_id, auth.uid()));
  END IF;
END $$;

-- club_semester_cycles
-- select: 공개 (동아리는 공개 엔티티). write: 클럽 관리자만.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'semester_cycles_select') THEN
    CREATE POLICY semester_cycles_select ON club_semester_cycles FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'semester_cycles_write') THEN
    CREATE POLICY semester_cycles_write ON club_semester_cycles FOR ALL
      USING (is_club_admin(club_id, auth.uid()))
      WITH CHECK (is_club_admin(club_id, auth.uid()));
  END IF;
END $$;

-- persona_channel_credentials
-- select/write 모두 편집자만. encrypted_token은 민감 정보.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'channel_creds_select') THEN
    CREATE POLICY channel_creds_select ON persona_channel_credentials FOR SELECT
      USING (can_edit_persona(persona_id, auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'channel_creds_write') THEN
    CREATE POLICY channel_creds_write ON persona_channel_credentials FOR ALL
      USING (can_edit_persona(persona_id, auth.uid()))
      WITH CHECK (can_edit_persona(persona_id, auth.uid()));
  END IF;
END $$;


-- ============================================================
-- Comments
-- ============================================================
COMMENT ON TABLE persona_output_bundles IS
  '이벤트(모집/주간업데이트/쇼케이스 등) 단위 콘텐츠 번들. 여러 persona_outputs를 묶어 승인·발행.';
COMMENT ON COLUMN persona_output_bundles.event_metadata IS
  '이벤트별 메타. {week_number, cohort, deadline, ...}. Zod로 앱 레이어 검증.';
COMMENT ON COLUMN persona_output_bundles.status IS
  'generating→pending_approval→approved→published. 거절 시 rejected.';
COMMENT ON TABLE club_semester_cycles IS
  '학기 사이클. 주차 기반 이벤트 제안의 기준점.';
COMMENT ON TABLE persona_channel_credentials IS
  '외부 SNS/이메일 OAuth 토큰. 조직 소유 (회장 교체에도 유지). R3.4에서 OAuth 플로우 구현.';
COMMENT ON COLUMN persona_outputs.bundle_id IS
  'R3.1에서 추가. 번들에 속한 출력물은 FK로 연결, 레거시 단독 출력은 NULL.';
COMMENT ON COLUMN persona_outputs.is_copy_only IS
  'true면 자동 발행 불가 (에브리타임·네이버·카톡 등). UI에서 클립보드 복사 버튼만 제공.';
