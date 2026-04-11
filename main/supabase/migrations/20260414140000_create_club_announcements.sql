-- Phase 3: 클럽 공지 시스템
--
-- 관리자가 작성 → 멤버가 읽음 → (선택) 웹훅으로 Discord/Slack 전달

CREATE TABLE IF NOT EXISTS club_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_club_announcements_club
  ON club_announcements(club_id, created_at DESC);

-- updated_at 자동 갱신
DROP TRIGGER IF EXISTS trg_club_announcements_updated_at ON club_announcements;
CREATE TRIGGER trg_club_announcements_updated_at
  BEFORE UPDATE ON club_announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE club_announcements ENABLE ROW LEVEL SECURITY;

-- 클럽 멤버는 읽기 가능
CREATE POLICY "club_announcements_read"
  ON club_announcements FOR SELECT
  USING (is_club_member(club_id, auth.uid()));

-- 관리자만 작성 가능
CREATE POLICY "club_announcements_insert"
  ON club_announcements FOR INSERT
  WITH CHECK (is_club_admin(club_id, auth.uid()));

-- 관리자만 수정 가능
CREATE POLICY "club_announcements_update"
  ON club_announcements FOR UPDATE
  USING (is_club_admin(club_id, auth.uid()));

-- 관리자만 삭제 가능
CREATE POLICY "club_announcements_delete"
  ON club_announcements FOR DELETE
  USING (is_club_admin(club_id, auth.uid()));
