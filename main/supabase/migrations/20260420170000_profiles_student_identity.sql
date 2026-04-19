-- Phase 1-a: 학생 신원 필드 (학번/학과/입학년도/인증일)
-- universities 테이블은 이미 존재 (20260410120000). 여기선 profiles에 FK + 학적 필드만 추가.
-- 기존 profiles.university (text), profiles.major (text)는 보존 — 비-학생/레거시 유저 호환.
-- 새 필드는 "학생 신원 검증이 된 경우"에만 채워지는 구조.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS university_id uuid REFERENCES universities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS student_id text,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS entrance_year int,
  ADD COLUMN IF NOT EXISTS student_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS student_verification_method text
    CHECK (student_verification_method IS NULL OR student_verification_method IN (
      'email_domain',  -- Phase 1: @ac.kr 이메일 매칭
      'sso',           -- Phase 2: 학교 SSO
      'ocr',           -- Phase 3: 학생증 OCR
      'manual_admin'   -- 관리자 수동 검증
    ));

-- entrance_year 범위 체크 (1990~현재+1년, 휴학 복학 허용)
-- 의도: 학번에서 파싱한 연도가 합리적 범위인지만 검증. 너무 엄격하면 복학생 이슈.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_entrance_year_range'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_entrance_year_range
      CHECK (entrance_year IS NULL OR (entrance_year >= 1990 AND entrance_year <= 2030));
  END IF;
END $$;

-- university_id로 조회 빈번 예상 (기관 리포트, 동아리 뱃지 매칭)
CREATE INDEX IF NOT EXISTS idx_profiles_university_id ON profiles(university_id)
  WHERE university_id IS NOT NULL;

-- student_verified_at is NOT NULL → 인증된 학생만 필터링 (B2B 리포트용)
CREATE INDEX IF NOT EXISTS idx_profiles_student_verified ON profiles(student_verified_at)
  WHERE student_verified_at IS NOT NULL;
