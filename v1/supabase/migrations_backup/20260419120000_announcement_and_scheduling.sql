-- ============================================================
-- Announcement event type + scheduled publishing
-- ============================================================
-- mirra.my식 "지속적 콘텐츠 스트림" 패러다임 도입:
--   1) event_type에 'announcement' 추가 — 범용 공지 (서브카테고리 = event_metadata.category)
--   2) persona_outputs에 scheduled_at — 발행 예약 시간
--   3) cron이 scheduled_at 기준으로 발행 처리 (별도 라우트에서 구현)
-- ============================================================


-- ============================================================
-- 1) persona_output_bundles.event_type CHECK 재정의 — 'announcement' 추가
-- ============================================================
-- 기존 CHECK 제약 드롭 후 재생성. event_type 이름은 20260418150000에서 자동 생성된 이름.
-- pg_constraint에서 정확한 이름 조회 후 드롭.
DO $$
DECLARE
  cons_name text;
BEGIN
  SELECT conname INTO cons_name
  FROM pg_constraint
  WHERE conrelid = 'persona_output_bundles'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%event_type%';

  IF cons_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE persona_output_bundles DROP CONSTRAINT %I', cons_name);
  END IF;
END $$;

ALTER TABLE persona_output_bundles
  ADD CONSTRAINT persona_output_bundles_event_type_check
  CHECK (event_type IN (
    'recruit_teaser',
    'recruit_open',
    'recruit_close',
    'onboarding',
    'project_kickoff',
    'weekly_update',
    'monthly_recap',
    'mid_showcase',
    'sponsor_outreach',
    'final_showcase',
    'semester_report',
    'vacation_harvest',
    'announcement'  -- ★ 신규: 범용 공지 (서브카테고리는 event_metadata.category로)
  ));


-- ============================================================
-- 2) persona_outputs.scheduled_at — 발행 예약 시간
-- ============================================================
-- NULL이면 "즉시 발행" 또는 "아직 예약 안 됨". 크론은 scheduled_at <= now()인 것만 처리.
ALTER TABLE persona_outputs
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS scheduled_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 크론 스캔용 부분 인덱스: 예약 대기 상태만 빠르게 조회
CREATE INDEX IF NOT EXISTS idx_persona_outputs_scheduled_pending
  ON persona_outputs(scheduled_at)
  WHERE scheduled_at IS NOT NULL
    AND status IN ('approved', 'draft');


-- ============================================================
-- Comments
-- ============================================================
COMMENT ON COLUMN persona_outputs.scheduled_at IS
  '예약 발행 시간. NULL이면 즉시 발행 또는 미예약. 크론이 scheduled_at<=now() AND status IN(approved,draft)인 것만 발행.';
