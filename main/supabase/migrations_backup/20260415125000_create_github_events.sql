-- GitHub → Draft 연동을 위한 github_events 테이블
-- push 이벤트 수신 → raw 저장 + AI 요약 + Discord 알림

-- 1. profiles에 github_username 추가
-- github_url(프로필 URL)과 별개로, push 이벤트 pusher 매칭에 사용
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS github_username text;

-- github_username으로 빠른 조회 (push 이벤트마다 호출)
-- GitHub username은 대소문자 구분하지 않으므로 LOWER() 인덱스 사용
CREATE INDEX IF NOT EXISTS idx_profiles_github_username
  ON profiles(LOWER(github_username)) WHERE github_username IS NOT NULL;

-- 2. github_events 테이블
CREATE TABLE IF NOT EXISTS github_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 어느 클럽의 이벤트인지 (harness_connectors에서 repo→club 매핑)
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  -- 특정 프로젝트에 연결 (null이면 클럽 레벨)
  project_id uuid REFERENCES opportunities(id) ON DELETE SET NULL,
  -- push한 사람의 GitHub username (raw)
  pusher_github_username text NOT NULL,
  -- Draft 유저 매핑 성공 시 club_members.id (null이면 매칭 실패)
  pusher_member_id uuid REFERENCES club_members(id) ON DELETE SET NULL,
  -- 리포지토리 이름 (예: "owner/repo")
  repo_name text NOT NULL,
  -- 브랜치 (refs/heads/ 제거된 이름)
  branch text NOT NULL,
  -- raw 커밋 데이터
  commits jsonb NOT NULL DEFAULT '[]',
  -- AI가 생성한 요약 (비동기 처리, 처음에는 null)
  ai_summary text,
  -- Discord에 보낸 메시지 ID (추후 스레드/업데이트용)
  discord_message_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 클럽별 최신순 조회 (대시보드 피드용)
CREATE INDEX IF NOT EXISTS idx_github_events_club_created
  ON github_events(club_id, created_at DESC);

-- 리포지토리별 조회 (같은 repo의 이벤트 묶어보기)
CREATE INDEX IF NOT EXISTS idx_github_events_repo
  ON github_events(repo_name, created_at DESC);

-- RLS: 클럽 멤버만 조회 가능, 삽입은 서비스 롤만 (webhook API에서 admin client 사용)
ALTER TABLE github_events ENABLE ROW LEVEL SECURITY;

-- 클럽 멤버는 자기 클럽의 이벤트 조회 가능
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'github_events_select_member') THEN
    CREATE POLICY github_events_select_member ON github_events FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM club_members
          WHERE club_members.club_id = github_events.club_id
            AND club_members.user_id = auth.uid()
            AND club_members.status = 'active'
        )
      );
  END IF;
END $$;
