-- 2026-04-18: 수락률 자동 억제 쿼리 성능 개선
-- acceptance-tracker가 (channel, pattern, created_at)으로 그룹 집계를 하므로
-- 기존 (channel, created_at) 인덱스 + 이 복합 인덱스 추가로 스캔 최소화.

CREATE INDEX IF NOT EXISTS idx_bot_interventions_channel_pattern_created
  ON bot_interventions (discord_channel_id, pattern_type, created_at DESC);
