-- ============================================================
-- P0-2: audit_logs — 엔터프라이즈 감사 로그 (2026-04-20)
-- ============================================================
-- 목적: 대학·기관 실사 대응. "누가 언제 무엇을 수정/삭제/접근했나" 추적.
--
-- 설계:
-- - append-only. UPDATE/DELETE 비허용 (RLS 로 차단).
-- - actor_user_id NULLable (system/cron 이벤트 허용).
-- - diff jsonb: { before, after } 선택적으로 저장. 민감 필드는 제외하고 집어넣기.
-- - context jsonb: IP, user-agent, request_id 등.
-- - 보존: 3년 (PIPA 법정 보존 고려). 이후 파기 크론 (별도 구현).
--
-- 쓰기: `src/lib/audit.ts` 헬퍼 (writeAuditLog) 사용. API 라우트에서 핵심 액션 뒤 호출.
-- 읽기: 어드민 대시보드·기관 리포트·정보주체 열람 요청 대응용.

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 누가 (NULL = system/cron)
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- 무엇을
  action text NOT NULL CHECK (action ~ '^[a-z_]+\.[a-z_]+$'),
    -- 형식: '<resource>.<verb>' 예: 'club_member.role_change', 'clubs.delete', 'personas.publish'
  target_type text NOT NULL,    -- 'club_member', 'club', 'persona', 'institution_member' 등
  target_id uuid,               -- 대상 row id (없으면 null)

  -- 변경 내역
  diff jsonb,                   -- { before: {...}, after: {...} }. 민감 필드는 mask 후 저장.
  context jsonb,                -- { ip, user_agent, request_id, club_id, institution_id 등 }

  created_at timestamptz NOT NULL DEFAULT now()
);

-- 인덱스: 리포트 쿼리 패턴 기반.
-- actor 별 이력 조회 (자주 씀)
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_time
  ON audit_logs(actor_user_id, created_at DESC)
  WHERE actor_user_id IS NOT NULL;

-- target 별 이력 (감사 추적용)
CREATE INDEX IF NOT EXISTS idx_audit_logs_target
  ON audit_logs(target_type, target_id, created_at DESC)
  WHERE target_id IS NOT NULL;

-- action 별 집계 (KPI)
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_time
  ON audit_logs(action, created_at DESC);

-- 기관 리포트용 (context 에 institution_id 넣어서 쓰는 경우)
-- GIN 인덱스로 jsonb 질의 최적화.
CREATE INDEX IF NOT EXISTS idx_audit_logs_context_gin
  ON audit_logs USING gin(context);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 읽기: 본인 액션 + is_platform_admin jwt 클레임.
-- 어드민은 모든 것 조회 가능. 일반 유저는 자기 것만 (정보주체 열람 요청 대응).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'audit_logs_select_own_or_admin') THEN
    CREATE POLICY audit_logs_select_own_or_admin ON audit_logs
      FOR SELECT
      USING (
        actor_user_id = auth.uid()
        OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
      );
  END IF;
END $$;

-- 쓰기: authenticated 유저는 본인 액션으로만 insert 가능.
-- service_role 은 BYPASSRLS 로 모두 가능 (크론/백엔드 job).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'audit_logs_insert_as_self') THEN
    CREATE POLICY audit_logs_insert_as_self ON audit_logs
      FOR INSERT
      WITH CHECK (
        actor_user_id IS NULL  -- system
        OR actor_user_id = auth.uid()
      );
  END IF;
END $$;

-- UPDATE/DELETE: 정책 없음 = 전부 차단. append-only 보장.

COMMENT ON TABLE audit_logs IS
  'P0-2 엔터프라이즈 감사 로그 (2026-04-20). 운영진/어드민/system 액션 추적. append-only.';
COMMENT ON COLUMN audit_logs.action IS
  '형식: <resource>.<verb>, 예: club_member.role_change, clubs.delete, personas.publish';
COMMENT ON COLUMN audit_logs.diff IS
  '{ before: {...}, after: {...} }. 민감필드(password, token 등) 제외 후 저장.';
COMMENT ON COLUMN audit_logs.context IS
  'IP, user_agent, request_id, scope(club_id/institution_id), etc.';
