-- 주차 카운터: 첫 /마무리 시 사용자가 입력, 이후 자동 증가
ALTER TABLE IF EXISTS club_ghostwriter_settings
  ADD COLUMN IF NOT EXISTS current_week integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS week_started_at timestamptz DEFAULT NULL;

COMMENT ON COLUMN club_ghostwriter_settings.current_week IS '현재 주차 (첫 /마무리 시 사용자 입력, 이후 매주 +1)';
COMMENT ON COLUMN club_ghostwriter_settings.week_started_at IS 'current_week가 설정된 시점 (자동 증가 기준점)';
