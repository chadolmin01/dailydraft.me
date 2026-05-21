-- discord_role_mappings: Draft 개념(직군/기수/클럽역할) → Discord Role ID 매핑
--
-- 각 Discord 서버는 고유한 Role ID를 가지므로, 클럽별로 매핑이 필요.
-- Draft가 source of truth이고, Discord는 표시 대상.
--
-- mapping_type 종류:
--   'position' → desired_position의 roleGroup (developer, designer, pm 등)
--   'cohort'   → club_members.cohort (1기, 2기 등)
--   'club_role' → club_members.role (admin, owner → 운영진)

CREATE TABLE IF NOT EXISTS discord_role_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  discord_guild_id text NOT NULL,

  -- Draft 개념 → Discord 역할 매핑
  mapping_type text NOT NULL CHECK (mapping_type IN ('position', 'cohort', 'club_role')),
  draft_value text NOT NULL,       -- 예: 'developer', '1기', 'admin'
  discord_role_id text NOT NULL,   -- Discord 서버의 실제 Role ID
  discord_role_name text,          -- 디버깅/표시용 (예: '@개발자')

  created_at timestamptz NOT NULL DEFAULT now(),

  -- 클럽+타입+값 조합은 유일해야 함 (같은 클럽에서 developer를 두 번 매핑할 수 없음)
  UNIQUE(club_id, mapping_type, draft_value)
);

CREATE INDEX IF NOT EXISTS idx_discord_role_mappings_club
  ON discord_role_mappings(club_id);

CREATE INDEX IF NOT EXISTS idx_discord_role_mappings_guild
  ON discord_role_mappings(discord_guild_id);

-- RLS
ALTER TABLE discord_role_mappings ENABLE ROW LEVEL SECURITY;

-- 클럽 멤버는 읽기 가능 (자기 역할 매핑 확인용)
CREATE POLICY "discord_role_mappings_read"
  ON discord_role_mappings FOR SELECT
  USING (is_club_member(club_id, auth.uid()));

-- 클럽 관리자만 매핑 생성/수정/삭제 가능
CREATE POLICY "discord_role_mappings_insert"
  ON discord_role_mappings FOR INSERT
  WITH CHECK (is_club_admin(club_id, auth.uid()));

CREATE POLICY "discord_role_mappings_update"
  ON discord_role_mappings FOR UPDATE
  USING (is_club_admin(club_id, auth.uid()));

CREATE POLICY "discord_role_mappings_delete"
  ON discord_role_mappings FOR DELETE
  USING (is_club_admin(club_id, auth.uid()));
