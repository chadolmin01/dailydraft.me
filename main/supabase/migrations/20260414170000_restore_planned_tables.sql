-- 그룹 B 테이블 복원: 아직 미구현이지만 구현 예정인 기능들
-- bot_interventions, comment_reports, helpful_votes

CREATE TABLE IF NOT EXISTS bot_interventions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id),
  discord_guild_id text NOT NULL,
  discord_channel_id text NOT NULL,
  pattern_type text NOT NULL,
  trigger_type text NOT NULL DEFAULT 'auto',
  confidence numeric NOT NULL,
  bot_message_id text,
  user_response text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comment_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES comments(id),
  reporter_identifier text NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS helpful_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES comments(id),
  voter_identifier text NOT NULL,
  created_at timestamptz DEFAULT now()
);
