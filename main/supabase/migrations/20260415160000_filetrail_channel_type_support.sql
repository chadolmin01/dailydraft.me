-- FileTrail 채널 타입별 분기 지원
-- 텍스트 채널(type 0): 스레드 생성 + 질문
-- 포럼 채널(type 15): 조용히 DB 수집만

-- 1) discord_team_channels에 파일 추적 설정 추가
ALTER TABLE discord_team_channels
  ADD COLUMN IF NOT EXISTS channel_type integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS file_tracking_enabled boolean NOT NULL DEFAULT false;

-- 2) file_logs에 포럼 메타데이터 컬럼 추가
-- source_channel_type: 0=텍스트, 15=포럼 — 어디서 수집된 파일인지 구분
ALTER TABLE file_logs
  ADD COLUMN IF NOT EXISTS source_channel_type integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forum_post_title text,
  ADD COLUMN IF NOT EXISTS forum_post_tags jsonb DEFAULT '[]';

-- 3) 포럼 채널은 opportunity_id 없이도 등록 가능 (클럽 공용 채널)
-- 기존 NOT NULL 제약이 있으면 제거
DO $$ BEGIN
  -- opportunity_id가 NOT NULL이면 nullable로 변경
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'discord_team_channels'
      AND column_name = 'opportunity_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE discord_team_channels
      ALTER COLUMN opportunity_id DROP NOT NULL;
  END IF;
END $$;

-- 4) file_logs 클럽 단위 검색 인덱스 (포럼 + 텍스트 크로스 채널 검색)
CREATE INDEX IF NOT EXISTS idx_file_logs_club_type
  ON file_logs(club_id, source_channel_type, created_at DESC);
