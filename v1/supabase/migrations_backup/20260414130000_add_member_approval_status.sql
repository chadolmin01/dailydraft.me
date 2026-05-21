-- Phase 2: 멤버 승인 워크플로우
--
-- club_members에 status 필드 추가: active(기본) / pending(승인 대기) / rejected
-- require_approval이 켜진 클럽에서 초대코드로 가입하면 pending으로 시작.
-- 관리자가 approve하면 active로 전환.

-- ============================================================
-- 1. club_members.status 추가
-- ============================================================
ALTER TABLE club_members
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'pending', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_club_members_status
  ON club_members(club_id, status);

-- ============================================================
-- 2. RLS 업데이트: pending/rejected 멤버는 관리자와 본인만 볼 수 있음
-- ============================================================
DROP POLICY IF EXISTS club_members_select_all ON club_members;
CREATE POLICY club_members_select_all ON club_members FOR SELECT
  USING (
    status = 'active'
    OR user_id = auth.uid()
    OR is_club_admin(club_id, auth.uid())
  );

-- ============================================================
-- 3. is_club_member, is_club_admin에 status = 'active' 조건 추가
-- pending 멤버가 관리자 권한을 갖는 것을 방지
-- ============================================================
CREATE OR REPLACE FUNCTION is_club_member(p_club_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM club_members
    WHERE club_id = p_club_id
      AND user_id = p_user_id
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION is_club_admin(p_club_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM club_members
    WHERE club_id = p_club_id
      AND user_id = p_user_id
      AND role IN ('owner', 'admin')
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION is_club_owner(p_club_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM club_members
    WHERE club_id = p_club_id
      AND user_id = p_user_id
      AND role = 'owner'
      AND status = 'active'
  );
$$;
