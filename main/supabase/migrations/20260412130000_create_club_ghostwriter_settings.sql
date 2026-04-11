-- club_ghostwriter_settings: 동아리장이 커스텀 가능한 Ghostwriter 설정
-- 체크인 템플릿, 스케줄, AI 톤, 임계값 등

CREATE TABLE IF NOT EXISTS club_ghostwriter_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,

  -- 체크인 템플릿 (포럼 스레드에 사용될 본문)
  -- null이면 시스템 기본 템플릿 사용
  checkin_template text,

  -- 스케줄 (0=일, 1=월, ..., 6=토)
  checkin_day smallint NOT NULL DEFAULT 1,        -- 기본: 월요일
  generate_day smallint NOT NULL DEFAULT 0,       -- 기본: 일요일

  -- AI 톤
  -- formal: 합쇼체, casual: 해요체, english: 영어
  ai_tone text NOT NULL DEFAULT 'formal'
    CHECK (ai_tone IN ('formal', 'casual', 'english')),

  -- 초안 생성 최소 메시지 수 (이보다 적으면 "활동 부족" 처리)
  min_messages smallint NOT NULL DEFAULT 5
    CHECK (min_messages BETWEEN 1 AND 50),

  -- 승인 타임아웃 (시간 단위, 초과 시 자동 게시)
  timeout_hours smallint NOT NULL DEFAULT 24
    CHECK (timeout_hours BETWEEN 1 AND 168),

  -- AI에게 추가로 전달할 한 줄 지시 (예: "기술 스택 언급 금지")
  custom_prompt_hint text,

  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(club_id),
  CHECK (checkin_day BETWEEN 0 AND 6),
  CHECK (generate_day BETWEEN 0 AND 6)
);

CREATE INDEX IF NOT EXISTS idx_club_ghostwriter_settings_club
  ON club_ghostwriter_settings(club_id);

-- updated_at 자동 갱신
CREATE OR REPLACE TRIGGER set_club_ghostwriter_settings_updated_at
  BEFORE UPDATE ON club_ghostwriter_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE club_ghostwriter_settings ENABLE ROW LEVEL SECURITY;

-- 클럽 멤버는 읽기 가능
CREATE POLICY "club_ghostwriter_settings_read"
  ON club_ghostwriter_settings FOR SELECT
  USING (is_club_member(club_id, auth.uid()));

-- 클럽 관리자만 수정 가능
CREATE POLICY "club_ghostwriter_settings_write"
  ON club_ghostwriter_settings FOR INSERT
  WITH CHECK (is_club_admin(club_id, auth.uid()));

CREATE POLICY "club_ghostwriter_settings_update"
  ON club_ghostwriter_settings FOR UPDATE
  USING (is_club_admin(club_id, auth.uid()));
