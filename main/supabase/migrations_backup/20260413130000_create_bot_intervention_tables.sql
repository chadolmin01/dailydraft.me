-- 실시간 봇 개입 기록 + 팀 리소스/작업 추적
-- bot_interventions: 봇이 언제 어떤 패턴으로 개입했는지 (분석/학습용)
-- team_tasks: 대화에서 감지된 할 일 추적
-- team_resources: 대화에서 공유된 링크/자료 보관
-- team_decisions: 투표로 확정된 결정사항

-- ============================================================
-- 1. bot_interventions — 봇 개입 로그
-- ============================================================
CREATE TABLE IF NOT EXISTS bot_interventions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  discord_channel_id text NOT NULL,
  discord_guild_id text NOT NULL,
  -- 감지된 패턴 타입
  pattern_type text NOT NULL CHECK (pattern_type IN (
    'decision-deadlock', 'task-assignment', 'schedule-coordination',
    'resource-shared', 'blocker-frustration', 'scope-creep',
    'handoff-pending', 'retrospective', 'unowned-task',
    'unanswered-question', 'conversation-end'
  )),
  -- AI confidence 점수 (0.0~1.0)
  confidence numeric(3,2) NOT NULL,
  -- 사용자 반응: accepted, dismissed, ignored(무반응)
  user_response text DEFAULT 'ignored' CHECK (user_response IN ('accepted', 'dismissed', 'ignored')),
  -- 봇이 보낸 메시지 ID (리액션 추적용)
  bot_message_id text,
  -- 트리거 방식: ai_detect, slash_command, auto_summary
  trigger_type text NOT NULL DEFAULT 'ai_detect' CHECK (trigger_type IN ('ai_detect', 'slash_command', 'auto_summary')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bot_interventions_club
  ON bot_interventions(club_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bot_interventions_channel
  ON bot_interventions(discord_channel_id, created_at DESC);

-- ============================================================
-- 2. team_tasks — 대화에서 감지된 할 일
-- ============================================================
CREATE TABLE IF NOT EXISTS team_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE CASCADE,
  discord_channel_id text,
  -- 담당자 (Discord username, Draft user_id가 없을 수 있음)
  assignee_name text NOT NULL,
  assignee_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  -- 작업 내용
  task_description text NOT NULL,
  deadline text,
  -- 상태
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'cancelled')),
  -- 어떤 봇 개입에서 생성됐는지
  source_intervention_id uuid REFERENCES bot_interventions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_team_tasks_club
  ON team_tasks(club_id, status);
CREATE INDEX IF NOT EXISTS idx_team_tasks_opportunity
  ON team_tasks(opportunity_id);

-- ============================================================
-- 3. team_resources — 대화에서 공유된 링크/자료
-- ============================================================
CREATE TABLE IF NOT EXISTS team_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE CASCADE,
  discord_channel_id text,
  -- 자료 정보
  url text NOT NULL,
  label text NOT NULL,
  shared_by_name text NOT NULL,
  shared_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  -- 자료 타입 자동 분류
  resource_type text DEFAULT 'link' CHECK (resource_type IN (
    'design', 'document', 'reference', 'code', 'link'
  )),
  source_intervention_id uuid REFERENCES bot_interventions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_resources_club
  ON team_resources(club_id);
CREATE INDEX IF NOT EXISTS idx_team_resources_opportunity
  ON team_resources(opportunity_id);

-- ============================================================
-- 4. team_decisions — 투표로 확정된 결정사항
-- ============================================================
CREATE TABLE IF NOT EXISTS team_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE CASCADE,
  discord_channel_id text,
  -- 결정 내용
  topic text NOT NULL,
  result text NOT NULL,
  options jsonb,           -- [{ "option": "A", "votes": 3 }, ...]
  -- 투표 메시지 ID
  vote_message_id text,
  decided_at timestamptz NOT NULL DEFAULT now(),
  source_intervention_id uuid REFERENCES bot_interventions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_team_decisions_club
  ON team_decisions(club_id);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE bot_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_decisions ENABLE ROW LEVEL SECURITY;

-- bot_interventions: 클럽 멤버 읽기, 서비스 키로만 쓰기
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'bot_interventions_select_member') THEN
    CREATE POLICY bot_interventions_select_member ON bot_interventions FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM club_members cm
          WHERE cm.club_id = bot_interventions.club_id
            AND cm.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- team_tasks: 클럽 멤버 읽기/수정
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'team_tasks_select_member') THEN
    CREATE POLICY team_tasks_select_member ON team_tasks FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM club_members cm
          WHERE cm.club_id = team_tasks.club_id
            AND cm.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'team_tasks_update_member') THEN
    CREATE POLICY team_tasks_update_member ON team_tasks FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM club_members cm
          WHERE cm.club_id = team_tasks.club_id
            AND cm.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- team_resources: 클럽 멤버 읽기
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'team_resources_select_member') THEN
    CREATE POLICY team_resources_select_member ON team_resources FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM club_members cm
          WHERE cm.club_id = team_resources.club_id
            AND cm.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- team_decisions: 클럽 멤버 읽기
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'team_decisions_select_member') THEN
    CREATE POLICY team_decisions_select_member ON team_decisions FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM club_members cm
          WHERE cm.club_id = team_decisions.club_id
            AND cm.user_id = auth.uid()
        )
      );
  END IF;
END $$;
