-- file_logs 보강: 이미 존재하면 무시 (idempotent)
-- 원본 CREATE TABLE에 포함되었을 수 있으나, 누락 시 대비

DO $$ BEGIN
  -- 1) 파일명 길이 제한
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'file_logs_filename_length'
  ) THEN
    ALTER TABLE file_logs
      ADD CONSTRAINT file_logs_filename_length CHECK (length(filename) <= 500);
  END IF;

  -- 2) 버전 체인 무결성
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'file_logs_version_chain'
  ) THEN
    ALTER TABLE file_logs
      ADD CONSTRAINT file_logs_version_chain CHECK (
        (parent_file_id IS NULL AND version = 1)
        OR (parent_file_id IS NOT NULL AND version > 1)
      );
  END IF;

  -- 3) responded_at 무결성
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'file_logs_responded_at_check'
  ) THEN
    ALTER TABLE file_logs
      ADD CONSTRAINT file_logs_responded_at_check CHECK (
        (response_status = 'pending' AND responded_at IS NULL)
        OR (response_status IN ('answered', 'skipped') AND responded_at IS NOT NULL)
      );
  END IF;
END $$;

-- 4) file_size bigint (이미 bigint이면 no-op)
ALTER TABLE file_logs
  ALTER COLUMN file_size TYPE bigint;

-- 5) 파일명 유사 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_file_logs_club_filename
  ON file_logs(club_id, filename);
