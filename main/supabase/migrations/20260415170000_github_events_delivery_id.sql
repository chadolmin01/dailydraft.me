-- GitHub webhook 중복 수신 방어를 위한 delivery_id 컬럼
-- GitHub는 X-GitHub-Delivery 헤더로 고유 ID를 보냄.
-- 실패 시 동일 delivery_id로 재전송하므로, UNIQUE 제약으로 중복 INSERT 방지.

ALTER TABLE github_events
  ADD COLUMN IF NOT EXISTS delivery_id text;

-- delivery_id가 있는 행끼리만 중복 방지 (NULL은 허용 — 기존 데이터 호환)
CREATE UNIQUE INDEX IF NOT EXISTS idx_github_events_delivery_id
  ON github_events(delivery_id) WHERE delivery_id IS NOT NULL;
