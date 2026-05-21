-- ============================================================
-- Personal Persona Waitlist (2026-04-20)
-- ============================================================
-- 개인 페르소나는 2026 여름 정식 출시 예정. 현재는 teaser 페이지에서
-- 이메일 알림 신청만 수집. 출시 시 배치 발송용.
-- ============================================================

CREATE TABLE IF NOT EXISTS persona_personal_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  source text NOT NULL DEFAULT 'profile_persona_teaser',
  created_at timestamptz NOT NULL DEFAULT now(),
  notified_at timestamptz,
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_persona_personal_waitlist_pending
  ON persona_personal_waitlist(created_at)
  WHERE notified_at IS NULL;

COMMENT ON TABLE persona_personal_waitlist IS
  '개인 페르소나 출시 알림 waitlist. 2026 여름 출시 시 배치 발송';
COMMENT ON COLUMN persona_personal_waitlist.source IS
  '유입 경로 (어떤 UI 에서 신청했는지). 향후 분석용';

ALTER TABLE persona_personal_waitlist ENABLE ROW LEVEL SECURITY;

-- 본인만 자기 record 조회/삽입
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'waitlist_self_select') THEN
    CREATE POLICY waitlist_self_select ON persona_personal_waitlist FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'waitlist_self_insert') THEN
    CREATE POLICY waitlist_self_insert ON persona_personal_waitlist FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- 본인 취소 가능 (UPDATE via notified_at 리셋 or DELETE)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'waitlist_self_delete') THEN
    CREATE POLICY waitlist_self_delete ON persona_personal_waitlist FOR DELETE
      USING (user_id = auth.uid());
  END IF;
END $$;
