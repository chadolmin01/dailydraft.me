-- ============================================================
-- P0-3: profiles soft delete — 정보주체 삭제권 (PIPA 36조) 대응
-- ============================================================
-- 목적: 회원 탈퇴 시 즉시 hard delete 대신 deleted_at 마킹.
--       30일 유예 후 크론이 hard delete 수행 (별도 잡으로 이후 구현).
--
-- 설계:
-- - deleted_at: 삭제 요청 시점. null = 정상, timestamp = 유예 중
-- - onboarding_completed 등 다른 필드 유지 — 유예 기간 중 복구 대응
-- - RLS 추가: deleted_at IS NOT NULL 이면 public SELECT 에서 숨김 (Explore People 필터링)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 삭제된 프로필은 Explore 에서 자동 제외 (부분 인덱스로 성능 유지)
CREATE INDEX IF NOT EXISTS idx_profiles_active
  ON profiles(user_id)
  WHERE deleted_at IS NULL;

-- 기존 profiles_select_public_or_self 정책 유지 + deleted_at 고려 재정의
DROP POLICY IF EXISTS profiles_select_public_or_self ON profiles;

CREATE POLICY profiles_select_public_or_self ON profiles
  FOR SELECT
  USING (
    -- 본인은 deleted_at 상관없이 자기 행 조회 가능 (복구 UI용)
    auth.uid() = user_id
    OR (
      -- 타인은 "공개 + 미삭제" 인 경우만
      profile_visibility = 'public'
      AND deleted_at IS NULL
    )
  );

COMMENT ON COLUMN profiles.deleted_at IS
  'P0-3 soft delete 마커 (PIPA 36조 삭제권). 유저가 탈퇴 요청한 시점. 30일 유예 후 크론이 hard delete.';
