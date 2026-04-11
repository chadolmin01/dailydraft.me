-- 클럽 알림 채널 (Discord/Slack 웹훅)
-- 클럽 운영자가 웹훅 URL을 등록하면, 주간 업데이트/공지 등이 자동 발송됨
CREATE TABLE IF NOT EXISTS club_notification_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  channel_type text NOT NULL CHECK (channel_type IN ('discord_webhook', 'slack_webhook')),
  webhook_url text NOT NULL,
  label text NOT NULL DEFAULT 'default',
  event_types text[] NOT NULL DEFAULT '{update_posted,update_remind,announcement}',
  enabled boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(club_id, webhook_url)
);

CREATE INDEX IF NOT EXISTS idx_club_notification_channels_club
  ON club_notification_channels(club_id);

ALTER TABLE club_notification_channels ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notification_channels_select_admin') THEN
    CREATE POLICY notification_channels_select_admin ON club_notification_channels FOR SELECT
      USING (is_club_admin(club_id, auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notification_channels_insert_admin') THEN
    CREATE POLICY notification_channels_insert_admin ON club_notification_channels FOR INSERT
      WITH CHECK (is_club_admin(club_id, auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notification_channels_update_admin') THEN
    CREATE POLICY notification_channels_update_admin ON club_notification_channels FOR UPDATE
      USING (is_club_admin(club_id, auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notification_channels_delete_admin') THEN
    CREATE POLICY notification_channels_delete_admin ON club_notification_channels FOR DELETE
      USING (is_club_admin(club_id, auth.uid()));
  END IF;
END $$;
