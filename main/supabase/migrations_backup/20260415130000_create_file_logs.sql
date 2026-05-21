-- FileTrail: 파일 업로드 추적 테이블
-- Discord 파일 업로드 시 메타데이터 + 유저 답변만 저장 (실제 파일 보관 안 함)
-- 계보(parent_file_id)로 같은 문서의 버전 체인을 추적
-- 봇 프로세스가 service_role_key로 INSERT (RLS bypass) → SELECT만 멤버 정책

CREATE TABLE IF NOT EXISTS file_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  discord_channel_id text NOT NULL,
  -- Gateway 재연결 시 MESSAGE_CREATE 재전송 → 중복 INSERT 방지
  discord_message_id text NOT NULL,
  uploader_discord_id text NOT NULL,
  uploader_name text NOT NULL,

  -- 파일 메타데이터 (실제 파일은 Discord에 그대로 둠)
  filename text NOT NULL CHECK (length(filename) <= 500),
  file_type text,            -- MIME type (application/pdf 등)
  file_size bigint,          -- bytes (bigint: 대용량 파일 대비)

  -- AI 분류 결과 (유저 답변 후 채워짐)
  category text,             -- 사업계획서, 회의록, 디자인, 발표자료 등
  tags jsonb DEFAULT '[]',   -- ["경기도청", "제출용"]

  -- 버전 체인: parent가 있으면 수정본, 없으면 신규 파일
  parent_file_id uuid REFERENCES file_logs(id) ON DELETE SET NULL,
  version integer NOT NULL DEFAULT 1,
  -- 무결성 보장: 신규(parent=null)면 v1, 수정본(parent≠null)이면 v2+
  CONSTRAINT file_logs_version_chain CHECK (
    (parent_file_id IS NULL AND version = 1)
    OR (parent_file_id IS NOT NULL AND version > 1)
  ),

  -- 유저 응답
  user_response text,        -- 유저의 한 줄 설명
  ai_summary text,           -- AI 요약

  -- 스레드 추적
  thread_id text,            -- Discord thread ID (Q&A 진행 장소)
  response_status text NOT NULL DEFAULT 'pending'
    CHECK (response_status IN ('pending', 'answered', 'skipped')),

  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,

  -- 무결성: answered/skipped면 responded_at 필수, pending이면 null
  CONSTRAINT file_logs_responded_at_check CHECK (
    (response_status = 'pending' AND responded_at IS NULL)
    OR (response_status IN ('answered', 'skipped') AND responded_at IS NOT NULL)
  )
);

-- 같은 메시지의 같은 파일 중복 방지 (Gateway 재전송 대비)
CREATE UNIQUE INDEX IF NOT EXISTS idx_file_logs_message_file
  ON file_logs(discord_message_id, filename);

CREATE INDEX IF NOT EXISTS idx_file_logs_club
  ON file_logs(club_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_logs_channel
  ON file_logs(discord_channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_logs_parent
  ON file_logs(parent_file_id);
CREATE INDEX IF NOT EXISTS idx_file_logs_thread
  ON file_logs(thread_id) WHERE thread_id IS NOT NULL;

-- 파일명 유사 검색 가속 (findSimilarFile에서 club 단위로 조회)
CREATE INDEX IF NOT EXISTS idx_file_logs_club_filename
  ON file_logs(club_id, filename);

-- RLS: 봇은 service_role_key로 INSERT (bypass), 멤버는 SELECT만
ALTER TABLE file_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'file_logs_select_member') THEN
    CREATE POLICY file_logs_select_member ON file_logs FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM club_members cm
          WHERE cm.club_id = file_logs.club_id
            AND cm.user_id = auth.uid()
        )
      );
  END IF;
END $$;
