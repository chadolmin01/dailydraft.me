-- 2026-04-18: 클럽별 운영진 채널 ID 저장 컬럼
-- 기존 DISCORD_OPS_DASHBOARD_CHANNEL_ID env 변수는 전역 fallback으로 남김.
-- 각 클럽이 자기만의 운영진 채널을 지정할 수 있어야 멀티클럽 환경에서 동작.
--
-- 값이 null 이면 ghostwriter-weekly-post 크론은 해당 클럽을 스킵하거나
-- 전역 fallback(env)을 사용합니다.

ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS operator_channel_id text;

COMMENT ON COLUMN clubs.operator_channel_id
  IS '운영진/임원진 Discord 채널 ID. Ghostwriter 주간 요약 자동 포스팅 대상.';
