-- ============================================================
-- Migration: Invitations P1 features
-- Date: 2026-04-09
-- Description:
--   - project_invitations: expires_at, decline_reason, last_reminder_at
--   - 'expired' status added to CHECK constraint
--   - user_blocks table for block/report system
-- ============================================================

-- ============================================================
-- 1. project_invitations P1 columns
-- ============================================================
ALTER TABLE public.project_invitations
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (now() + interval '14 days');

ALTER TABLE public.project_invitations
  ADD COLUMN IF NOT EXISTS decline_reason TEXT;

ALTER TABLE public.project_invitations
  ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMPTZ;

-- 'expired' 상태 추가 — lazy expire 시 사용 (cron 없이 GET 시점에 전환)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'project_invitations_status_check'
  ) THEN
    ALTER TABLE public.project_invitations DROP CONSTRAINT project_invitations_status_check;
  END IF;
  ALTER TABLE public.project_invitations
    ADD CONSTRAINT project_invitations_status_check
    CHECK (status IN ('pending', 'accepted', 'declined', 'expired'));
END $$;

CREATE INDEX IF NOT EXISTS idx_project_invitations_expires_at
  ON public.project_invitations(expires_at)
  WHERE status = 'pending';

-- ============================================================
-- 2. user_blocks table
-- ============================================================
-- 차단/신고 시스템: blocker가 blocked를 차단하면 양쪽 funnel(초대/커피챗/DM)이
-- 차단된다. 신고는 reason 컬럼으로 단순화 (전용 reports 테이블은 P2).
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON public.user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON public.user_blocks(blocked_id);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_blocks' AND policyname='user_blocks_select_own') THEN
    CREATE POLICY "user_blocks_select_own" ON public.user_blocks
      FOR SELECT USING (auth.uid() = blocker_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_blocks' AND policyname='user_blocks_insert_own') THEN
    CREATE POLICY "user_blocks_insert_own" ON public.user_blocks
      FOR INSERT WITH CHECK (auth.uid() = blocker_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_blocks' AND policyname='user_blocks_delete_own') THEN
    CREATE POLICY "user_blocks_delete_own" ON public.user_blocks
      FOR DELETE USING (auth.uid() = blocker_id);
  END IF;
END $$;

COMMENT ON TABLE public.user_blocks IS 'User-initiated blocks. Blocks invitations, coffee chats, and DMs from blocked user.';
