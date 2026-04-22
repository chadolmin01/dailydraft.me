-- ============================================================
-- 클럽 공식 인증 (요청제) — pending → admin approval
-- 2026-04-23
-- ============================================================
--
-- 배경:
-- /clubs/new 이 로그인만 하면 누구나 즉시 클럽을 만들 수 있어
-- 공개 목록이 신뢰 못 할 상태. "실제 학교 동아리 운영 인프라"
-- 포지셔닝과 어긋남. 모든 신규 클럽은 기본 'pending' 으로 들어가고
-- Draft admin 이 증빙 검토 후 승인해야 공개 목록에 노출됨.
--
-- 설계:
-- - 기존 clubs 는 'verified' 로 UPDATE (legacy 플래그는 university_id IS NULL 로 판별)
-- - 신규 insert 는 default 'pending'
-- - RLS: pending 은 creator + club admin + platform admin 만 조회 가능
-- ============================================================

ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS claim_status text NOT NULL DEFAULT 'pending'
    CHECK (claim_status IN ('pending', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS university_id uuid REFERENCES universities(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS verification_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verification_note text,
  ADD COLUMN IF NOT EXISTS verification_documents jsonb;

-- 기존 clubs: legacy 'verified' 처리. university_id NULL 이므로 배너로 업그레이드 유도
UPDATE clubs
  SET claim_status = 'verified'
  WHERE claim_status = 'pending'
    AND verification_submitted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_clubs_claim_status_pending
  ON clubs(claim_status, verification_submitted_at DESC)
  WHERE claim_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_clubs_university_id
  ON clubs(university_id) WHERE university_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clubs_claim_status_all
  ON clubs(claim_status);

-- ============================================================
-- RLS: pending/rejected 클럽은 creator + club admin + platform admin 만 조회
-- verified 는 모두 공개 (기존 정책 유지)
-- ============================================================

-- is_admin() 헬퍼 — platform_admins 테이블 기반 (2026-04-22 마이그레이션에서 생성됨)
-- 이미 다른 정책에서 쓰고 있다면 재정의 skip
CREATE OR REPLACE FUNCTION is_platform_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM platform_admins
    WHERE user_id = p_user_id
  );
$$;

-- 기존 SELECT 정책 drop 후 새 정책 생성
DROP POLICY IF EXISTS clubs_select_all ON clubs;
DROP POLICY IF EXISTS clubs_select_visible ON clubs;

CREATE POLICY clubs_select_visible ON clubs
  FOR SELECT
  USING (
    claim_status = 'verified'
    OR created_by = auth.uid()
    OR is_club_admin(id, auth.uid())
    OR is_platform_admin(auth.uid())
  );

-- INSERT: 기존과 동일 (auth.uid() = created_by) + claim_status 는 기본값 사용
DROP POLICY IF EXISTS clubs_insert_self ON clubs;
CREATE POLICY clubs_insert_self ON clubs
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
  );

-- UPDATE: club admin 은 기본 필드, platform admin 은 verification_* 필드까지
-- pending 중에는 creator 가 증빙 수정 가능
DROP POLICY IF EXISTS clubs_update_admin ON clubs;
CREATE POLICY clubs_update_admin ON clubs
  FOR UPDATE
  USING (
    is_club_admin(id, auth.uid())
    OR is_platform_admin(auth.uid())
    OR (created_by = auth.uid() AND claim_status IN ('pending', 'rejected'))
  )
  WITH CHECK (
    is_club_admin(id, auth.uid())
    OR is_platform_admin(auth.uid())
    OR (created_by = auth.uid() AND claim_status IN ('pending', 'rejected'))
  );

COMMENT ON COLUMN clubs.claim_status IS
  '클럽 인증 상태. pending=대기·검토 중, verified=공개·검색 가능, rejected=거부(재제출 가능)';
COMMENT ON COLUMN clubs.university_id IS
  '공식 등록 소속 학교. verified + NOT NULL 이면 학교 뱃지 부여. legacy clubs 는 NULL (배너로 업그레이드 유도)';
COMMENT ON COLUMN clubs.verification_documents IS
  '증빙 자료 jsonb. representative_name, representative_email, founding_year, activity_summary, website_url?, sns_url?, charter_url?';
