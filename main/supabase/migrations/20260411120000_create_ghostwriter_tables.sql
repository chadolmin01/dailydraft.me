-- Ghostwriter: Discord 메시지 → AI 주간 업데이트 초안
-- discord_team_channels: "이 Discord 채널 = 이 Draft 팀" 매핑
-- weekly_update_drafts: AI가 생성한 초안 (pending → approved/rejected)

-- ============================================================
-- 1. discord_bot_installations
-- 클럽이 Draft Discord Bot을 서버에 초대했을 때 기록
-- ============================================================
CREATE TABLE IF NOT EXISTS discord_bot_installations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  discord_guild_id text NOT NULL,
  discord_guild_name text,
  installed_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  installed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(club_id, discord_guild_id)
);

CREATE INDEX IF NOT EXISTS idx_discord_bot_installations_club
  ON discord_bot_installations(club_id);

-- ============================================================
-- 2. discord_team_channels
-- Discord 채널 ↔ Draft 프로젝트(opportunity) 매핑
-- ============================================================
CREATE TABLE IF NOT EXISTS discord_team_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  discord_channel_id text NOT NULL,
  discord_channel_name text,
  -- 메시지 수집 시 이 시점 이후의 메시지만 가져옴 (중복 방지)
  last_fetched_message_id text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(discord_channel_id),
  UNIQUE(opportunity_id)
);

CREATE INDEX IF NOT EXISTS idx_discord_team_channels_club
  ON discord_team_channels(club_id);

-- ============================================================
-- 3. weekly_update_drafts
-- AI가 생성한 주간 업데이트 초안
-- ============================================================
CREATE TABLE IF NOT EXISTS weekly_update_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  -- 초안 대상 팀원 (이 사람의 승인이 필요)
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number integer NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  update_type text NOT NULL DEFAULT 'general'
    CHECK (update_type IN ('ideation', 'design', 'development', 'launch', 'general')),
  -- AI가 요약에 사용한 원본 메시지 수 (투명성)
  source_message_count integer NOT NULL DEFAULT 0,
  -- pending: 검토 대기, approved: 승인됨(project_updates에 복사), rejected: 거절됨
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  -- 승인 시 생성된 project_update ID
  published_update_id uuid REFERENCES project_updates(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  -- 같은 프로젝트, 같은 주차에 중복 초안 방지
  UNIQUE(opportunity_id, week_number)
);

CREATE INDEX IF NOT EXISTS idx_weekly_update_drafts_target
  ON weekly_update_drafts(target_user_id, status);
CREATE INDEX IF NOT EXISTS idx_weekly_update_drafts_opportunity
  ON weekly_update_drafts(opportunity_id);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE discord_bot_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE discord_team_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_update_drafts ENABLE ROW LEVEL SECURITY;

-- discord_bot_installations: 클럽 admin만
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'discord_bot_select_admin') THEN
    CREATE POLICY discord_bot_select_admin ON discord_bot_installations FOR SELECT
      USING (is_club_admin(club_id, auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'discord_bot_insert_admin') THEN
    CREATE POLICY discord_bot_insert_admin ON discord_bot_installations FOR INSERT
      WITH CHECK (is_club_admin(club_id, auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'discord_bot_delete_admin') THEN
    CREATE POLICY discord_bot_delete_admin ON discord_bot_installations FOR DELETE
      USING (is_club_admin(club_id, auth.uid()));
  END IF;
END $$;

-- discord_team_channels: 클럽 admin만
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'discord_channels_select_admin') THEN
    CREATE POLICY discord_channels_select_admin ON discord_team_channels FOR SELECT
      USING (is_club_admin(club_id, auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'discord_channels_insert_admin') THEN
    CREATE POLICY discord_channels_insert_admin ON discord_team_channels FOR INSERT
      WITH CHECK (is_club_admin(club_id, auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'discord_channels_update_admin') THEN
    CREATE POLICY discord_channels_update_admin ON discord_team_channels FOR UPDATE
      USING (is_club_admin(club_id, auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'discord_channels_delete_admin') THEN
    CREATE POLICY discord_channels_delete_admin ON discord_team_channels FOR DELETE
      USING (is_club_admin(club_id, auth.uid()));
  END IF;
END $$;

-- weekly_update_drafts: 본인 것만 조회/수정
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'drafts_select_own') THEN
    CREATE POLICY drafts_select_own ON weekly_update_drafts FOR SELECT
      USING (target_user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'drafts_update_own') THEN
    CREATE POLICY drafts_update_own ON weekly_update_drafts FOR UPDATE
      USING (target_user_id = auth.uid());
  END IF;
END $$;

-- 운영자도 전체 초안 조회 가능 (모니터링용)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'drafts_select_club_admin') THEN
    CREATE POLICY drafts_select_club_admin ON weekly_update_drafts FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM opportunities o
          JOIN club_members cm ON cm.club_id = o.club_id
          WHERE o.id = weekly_update_drafts.opportunity_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('owner', 'admin')
        )
      );
  END IF;
END $$;
