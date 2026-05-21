-- 팀 채널 공개 범위 설정
-- isolated: 팀원만 볼 수 있음 (기본값, 창업동아리 등 아이디어 보안 중요)
-- open: 동아리 전체 공개 (스터디 모임 등 공유가 목적)
--
-- 클럽장이 Draft 설정 페이지에서 토글로 변경 가능
-- provision.ts가 이 값을 읽어서 Discord 채널 권한을 자동 세팅

ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS team_channel_visibility text NOT NULL DEFAULT 'isolated'
    CHECK (team_channel_visibility IN ('isolated', 'open'));

COMMENT ON COLUMN clubs.team_channel_visibility
  IS '팀 채널 공개 범위. isolated=팀원만, open=동아리 전체';
