-- 초대 코드 시스템
-- 양방향: (1) 멤버가 코드로 셀프 가입 (2) owner/admin이 직접 추가
-- 코드는 클럽+기수에 바인딩, 만료/사용횟수 제한 지원

CREATE TABLE IF NOT EXISTS club_invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  cohort text,
  role text NOT NULL DEFAULT 'member'
    CHECK (role IN ('admin', 'member')),
  max_uses int,
  use_count int NOT NULL DEFAULT 0,
  expires_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_club_invite_codes_club ON club_invite_codes(club_id);
CREATE INDEX IF NOT EXISTS idx_club_invite_codes_code ON club_invite_codes(code);

-- RLS
ALTER TABLE club_invite_codes ENABLE ROW LEVEL SECURITY;

-- 코드 조회: owner/admin만 (사용 현황 모니터링)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'invite_codes_select_admin') THEN
    CREATE POLICY invite_codes_select_admin ON club_invite_codes FOR SELECT
      USING (is_club_admin(club_id, auth.uid()));
  END IF;
END $$;

-- 코드 생성: owner/admin
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'invite_codes_insert_admin') THEN
    CREATE POLICY invite_codes_insert_admin ON club_invite_codes FOR INSERT
      WITH CHECK (is_club_admin(club_id, auth.uid()));
  END IF;
END $$;

-- 코드 수정 (비활성화 등): owner/admin
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'invite_codes_update_admin') THEN
    CREATE POLICY invite_codes_update_admin ON club_invite_codes FOR UPDATE
      USING (is_club_admin(club_id, auth.uid()));
  END IF;
END $$;

-- 코드 삭제: owner/admin
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'invite_codes_delete_admin') THEN
    CREATE POLICY invite_codes_delete_admin ON club_invite_codes FOR DELETE
      USING (is_club_admin(club_id, auth.uid()));
  END IF;
END $$;
