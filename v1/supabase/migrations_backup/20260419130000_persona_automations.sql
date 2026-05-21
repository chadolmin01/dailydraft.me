-- ============================================================
-- persona_automations — 재귀 자동 생성 스케줄
-- ============================================================
-- mirra 자동화 설정 패턴. 회장이 한번 설정해두면 매주/매일 AI가 자동으로
-- 덱을 생성하거나 생성+발행까지.
--
-- 크론(/api/cron/persona-automations-tick)이 next_run_at <= now()인 레코드를
-- 픽업 → createBundle 호출 → auto_publish면 approveBundle까지.
-- 실행 후 next_run_at을 다음 주기로 밀어 고정 (간단한 "인터벌" 모델,
-- RRULE 전체 구현은 R4 이후에 도입).
-- ============================================================

CREATE TABLE IF NOT EXISTS persona_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,

  -- 어떤 이벤트를 자동 생성할지 (persona_output_bundles.event_type 재사용)
  event_type text NOT NULL,

  -- 고정 프리셋에 따라 다음 실행 시각 계산
  -- daily        → 매일 run_hour 시
  -- weekly       → 매주 run_weekday(0=월) run_hour 시
  -- biweekly     → 2주마다
  -- monthly      → 매월 run_day_of_month 일 run_hour 시
  frequency text NOT NULL CHECK (frequency IN ('daily','weekly','biweekly','monthly')),

  -- 실행 시각 (KST 기준 정수, UTC 변환은 앱에서)
  run_hour integer NOT NULL DEFAULT 9 CHECK (run_hour BETWEEN 0 AND 23),
  run_minute integer NOT NULL DEFAULT 0 CHECK (run_minute BETWEEN 0 AND 59),
  -- 0=월 ... 6=일 (frequency=weekly/biweekly만)
  run_weekday integer CHECK (run_weekday BETWEEN 0 AND 6),
  -- 1~28 (frequency=monthly만)
  run_day_of_month integer CHECK (run_day_of_month BETWEEN 1 AND 28),

  -- 하루에 몇 개 생성할지 (mirra의 "일일 콘텐츠 수")
  daily_count integer NOT NULL DEFAULT 1 CHECK (daily_count BETWEEN 1 AND 5),

  -- true면 생성 직후 approveBundle까지 자동 호출 → 즉시 발행
  -- false면 pending_approval 상태로 두고 사용자가 검토
  auto_publish boolean NOT NULL DEFAULT false,

  -- 기본 이벤트 메타데이터 (title 접두어 등 자동 주입 전 기본값)
  default_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- 활성 여부
  active boolean NOT NULL DEFAULT true,

  -- 크론 스캔용. active=true AND next_run_at<=now()만 실행
  next_run_at timestamptz,
  last_run_at timestamptz,
  last_run_status text, -- 'ok' | 'failed' | null

  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_persona_automations_next_run
  ON persona_automations(next_run_at)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_persona_automations_persona
  ON persona_automations(persona_id, active);


-- ============================================================
-- RLS — can_edit_persona 재활용
-- ============================================================
ALTER TABLE persona_automations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'persona_automations'
      AND policyname = 'automations_select'
  ) THEN
    CREATE POLICY automations_select
      ON persona_automations FOR SELECT
      USING (can_view_persona(persona_id, auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'persona_automations'
      AND policyname = 'automations_write'
  ) THEN
    CREATE POLICY automations_write
      ON persona_automations FOR ALL
      USING (can_edit_persona(persona_id, auth.uid()))
      WITH CHECK (can_edit_persona(persona_id, auth.uid()));
  END IF;
END $$;


-- ============================================================
-- Trigger — updated_at 자동 갱신
-- ============================================================
CREATE OR REPLACE FUNCTION persona_automations_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_persona_automations_updated_at ON persona_automations;
CREATE TRIGGER trg_persona_automations_updated_at
  BEFORE UPDATE ON persona_automations
  FOR EACH ROW EXECUTE FUNCTION persona_automations_set_updated_at();


COMMENT ON TABLE persona_automations IS
  '재귀 자동 덱 생성 스케줄. 크론이 next_run_at<=now()인 active 레코드를 실행하고 next_run_at을 주기대로 민다.';
