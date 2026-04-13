-- Discord 봇 파이프라인 테이블 복원
-- bot_interventions → team_tasks / team_decisions / team_resources FK 구조

CREATE TABLE IF NOT EXISTS team_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id),
  opportunity_id uuid REFERENCES opportunities(id),
  discord_channel_id text,
  assignee_name text NOT NULL,
  assignee_user_id uuid,
  task_description text NOT NULL,
  deadline timestamptz,
  status text NOT NULL DEFAULT 'pending',
  source_intervention_id uuid REFERENCES bot_interventions(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS team_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id),
  opportunity_id uuid REFERENCES opportunities(id),
  discord_channel_id text,
  topic text NOT NULL,
  result text NOT NULL,
  options jsonb,
  vote_message_id text,
  decided_at timestamptz NOT NULL DEFAULT now(),
  source_intervention_id uuid REFERENCES bot_interventions(id)
);

CREATE TABLE IF NOT EXISTS team_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id),
  opportunity_id uuid REFERENCES opportunities(id),
  discord_channel_id text,
  url text NOT NULL,
  label text NOT NULL,
  shared_by_name text NOT NULL,
  shared_by_user_id uuid,
  resource_type text,
  source_intervention_id uuid REFERENCES bot_interventions(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
