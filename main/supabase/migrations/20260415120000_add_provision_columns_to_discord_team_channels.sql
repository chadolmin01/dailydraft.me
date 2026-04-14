-- discord_team_channels에 프로비저닝 관련 컬럼 추가
-- 자동 프로비저닝으로 생성된 카테고리와 Role ID를 저장
-- 나중에 cleanup(삭제) 시 이 ID들로 Discord에서 제거

ALTER TABLE discord_team_channels
  ADD COLUMN IF NOT EXISTS discord_category_id text,
  ADD COLUMN IF NOT EXISTS discord_role_id text;

COMMENT ON COLUMN discord_team_channels.discord_category_id IS '프로비저닝으로 생성된 Discord 카테고리 ID (cleanup용)';
COMMENT ON COLUMN discord_team_channels.discord_role_id IS '프로비저닝으로 생성된 팀 전용 Discord Role ID (cleanup용)';
