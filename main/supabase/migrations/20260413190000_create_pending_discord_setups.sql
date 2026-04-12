-- 봇 온보딩 완료 시 임시 저장
-- club_id/user_id를 모르는 상태에서 guild 정보 + 설정만 기록
-- Draft 웹에서 클럽 연결 시 이 데이터를 소비하고 discord_bot_installations + club_ghostwriter_settings 생성

CREATE TABLE IF NOT EXISTS pending_discord_setups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_guild_id text NOT NULL UNIQUE,
  discord_guild_name text,
  discord_owner_id text NOT NULL,
  selected_channels jsonb DEFAULT '[]'::jsonb,
  selected_tone text NOT NULL DEFAULT 'formal',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz
);

COMMENT ON TABLE pending_discord_setups IS '봇 온보딩 완료 → 웹에서 클럽 연결 전까지 임시 저장';
