-- 개인별 활동도 트래킹
-- Discord 메시지 수 기반 주차별 개인 참여도 저장
-- activity-tracker cron이 매주 일요일 ghostwriter 전에 집계

CREATE TABLE IF NOT EXISTS member_activity_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  discord_user_id text NOT NULL,
  discord_username text,
  week_number integer NOT NULL,
  year integer NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  message_count integer NOT NULL DEFAULT 0,
  channels_active integer NOT NULL DEFAULT 0,
  checkin_submitted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(club_id, discord_user_id, week_number, year)
);

-- 조회 성능: 클럽+주차 기준 조회가 메인
CREATE INDEX IF NOT EXISTS idx_member_activity_club_week
  ON member_activity_stats(club_id, year, week_number);
