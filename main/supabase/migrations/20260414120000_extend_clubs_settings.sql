-- Phase 1: clubs 테이블 확장 + is_club_member() 버그 수정
--
-- 변경사항:
-- 1. clubs에 visibility, require_approval, deleted_at 추가
-- 2. is_club_member() 함수 생성 (기존 RLS에서 참조하지만 누락된 상태)
-- 3. clubs SELECT 정책에 soft delete 필터 추가

-- ============================================================
-- 1. clubs 테이블 확장
-- ============================================================

-- 공개 범위: public(누구나), school_only(같은 학교), private(초대만)
ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'school_only', 'private'));

-- 가입 시 관리자 승인 필요 여부
ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS require_approval boolean NOT NULL DEFAULT false;

-- Soft delete (null이면 활성, 값이 있으면 삭제됨)
ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- ============================================================
-- 2. is_club_member() 함수 — 기존 RLS 정책이 참조하나 정의가 없었음
-- ghostwriter_settings, discord_role_mappings 등에서 사용
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
  );
$$;

-- ============================================================
-- 3. clubs SELECT 정책 업데이트 — soft delete 필터
-- ============================================================
-- 기존 정책 삭제 후 재생성 (deleted_at IS NULL 조건 추가)
DROP POLICY IF EXISTS clubs_select_all ON clubs;
CREATE POLICY clubs_select_all ON clubs FOR SELECT
  USING (deleted_at IS NULL);
