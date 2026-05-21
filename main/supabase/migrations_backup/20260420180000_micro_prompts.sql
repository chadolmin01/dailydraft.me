-- Phase 1-b: Ambient micro-prompts (로딩 스켈레톤 자리/사이드 카드용 1문항 시스템)
--
-- 설계 원칙 (onboarding_progressive_collection.md):
-- - 세션당 최대 1~2개, 거부 1회→24h 침묵, 3회 연속 거부→7일 침묵
-- - 답변은 "배치만 바꾼다" 원칙: 기존 질문 뱅크(interactive-questions.ts) 그대로 사용
-- - micro_prompts_log: 실제 응답/스킵 기록 (1 행 = 1 노출)
-- - micro_prompts_cooldown: 유저별 "다음 노출 가능 시점" 상태 테이블 (1 유저 = 1 행)
--
-- 테이블 분리 이유: 쿨다운은 읽기/쓰기 빈도가 훨씬 높고 단일 행 upsert. 로그는 append-only.
-- 한 테이블에 넣으면 매 노출마다 history 전체 스캔해야 함.

-- ============================================================
-- 1. micro_prompts_log (append-only 응답 기록)
-- ============================================================
CREATE TABLE IF NOT EXISTS micro_prompts_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id text NOT NULL,           -- interactive-questions.ts의 key (예: 'scenario_collaboration')
  -- 응답 형태: answered | skipped | dismissed
  --   answered: 선택지 골랐음 (response JSON)
  --   skipped: "나중에" 버튼 (쿨다운 연장)
  --   dismissed: X 버튼 (더 강한 쿨다운)
  action text NOT NULL CHECK (action IN ('answered', 'skipped', 'dismissed')),
  response jsonb,                       -- answered일 때만 채움 (선택한 option id 등)
  context text,                         -- 'loading_skeleton' | 'sidebar_card' | 'post_scroll' 등 노출 지점
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_micro_prompts_log_user
  ON micro_prompts_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_micro_prompts_log_question
  ON micro_prompts_log(user_id, question_id);

-- ============================================================
-- 2. micro_prompts_cooldown (유저별 상태 1행)
-- ============================================================
-- next_available_at: 다음 질문 노출 가능 시각 (now() 이상이면 노출 OK)
-- consecutive_skips: 연속 skip/dismiss 카운트. 응답 성공 시 0 리셋.
-- last_shown_at: 마지막 노출 시각 (세션당 1~2개 제한 체크용)
CREATE TABLE IF NOT EXISTS micro_prompts_cooldown (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  next_available_at timestamptz NOT NULL DEFAULT now(),
  consecutive_skips int NOT NULL DEFAULT 0,
  last_shown_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_micro_prompts_cooldown_next
  ON micro_prompts_cooldown(next_available_at);

-- updated_at 트리거
DROP TRIGGER IF EXISTS trg_micro_prompts_cooldown_updated_at ON micro_prompts_cooldown;
CREATE TRIGGER trg_micro_prompts_cooldown_updated_at
  BEFORE UPDATE ON micro_prompts_cooldown
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE micro_prompts_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE micro_prompts_cooldown ENABLE ROW LEVEL SECURITY;

-- 본인 데이터만 SELECT/INSERT 가능. 어드민 리포트는 service_role.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'micro_prompts_log_own_select') THEN
    CREATE POLICY micro_prompts_log_own_select ON micro_prompts_log FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'micro_prompts_log_own_insert') THEN
    CREATE POLICY micro_prompts_log_own_insert ON micro_prompts_log FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'micro_prompts_cooldown_own_select') THEN
    CREATE POLICY micro_prompts_cooldown_own_select ON micro_prompts_cooldown FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;

-- upsert용: INSERT / UPDATE 각자 허용 (WITH CHECK 로 탈취 방지)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'micro_prompts_cooldown_own_insert') THEN
    CREATE POLICY micro_prompts_cooldown_own_insert ON micro_prompts_cooldown FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'micro_prompts_cooldown_own_update') THEN
    CREATE POLICY micro_prompts_cooldown_own_update ON micro_prompts_cooldown FOR UPDATE
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
