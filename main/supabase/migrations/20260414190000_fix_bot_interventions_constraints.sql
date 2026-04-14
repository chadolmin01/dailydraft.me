-- bot_interventions 테이블 CHECK 제약조건 수정
-- 1. pattern_type: 'schedule-confirmed' 추가 (봇 엔진에서 사용하지만 누락됨)
-- 2. trigger_type: 코드에서 'auto'/'auto_summary' 사용하므로 일치시킴
-- 3. user_response: 기존 값 유지

-- 기존 CHECK 제약조건 제거 (있을 수도 없을 수도 있으므로 IF EXISTS 불가 → DO block)
DO $$
BEGIN
  -- pattern_type CHECK 제거
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'bot_interventions' AND column_name = 'pattern_type'
      AND constraint_name LIKE '%check%'
  ) THEN
    EXECUTE 'ALTER TABLE bot_interventions DROP CONSTRAINT ' ||
      (SELECT constraint_name FROM information_schema.constraint_column_usage
       WHERE table_name = 'bot_interventions' AND column_name = 'pattern_type'
         AND constraint_name LIKE '%check%' LIMIT 1);
  END IF;

  -- trigger_type CHECK 제거
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'bot_interventions' AND column_name = 'trigger_type'
      AND constraint_name LIKE '%check%'
  ) THEN
    EXECUTE 'ALTER TABLE bot_interventions DROP CONSTRAINT ' ||
      (SELECT constraint_name FROM information_schema.constraint_column_usage
       WHERE table_name = 'bot_interventions' AND column_name = 'trigger_type'
         AND constraint_name LIKE '%check%' LIMIT 1);
  END IF;

  -- user_response CHECK 제거
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'bot_interventions' AND column_name = 'user_response'
      AND constraint_name LIKE '%check%'
  ) THEN
    EXECUTE 'ALTER TABLE bot_interventions DROP CONSTRAINT ' ||
      (SELECT constraint_name FROM information_schema.constraint_column_usage
       WHERE table_name = 'bot_interventions' AND column_name = 'user_response'
         AND constraint_name LIKE '%check%' LIMIT 1);
  END IF;
END $$;

-- 새 CHECK 제약조건 추가
ALTER TABLE bot_interventions
  ADD CONSTRAINT bot_interventions_pattern_type_check
  CHECK (pattern_type IN (
    'decision-deadlock', 'task-assignment', 'schedule-coordination',
    'schedule-confirmed',
    'resource-shared', 'blocker-frustration', 'scope-creep',
    'handoff-pending', 'retrospective', 'unowned-task',
    'unanswered-question', 'conversation-end'
  ));

ALTER TABLE bot_interventions
  ADD CONSTRAINT bot_interventions_trigger_type_check
  CHECK (trigger_type IN ('auto', 'slash_command', 'auto_summary'));

ALTER TABLE bot_interventions
  ADD CONSTRAINT bot_interventions_user_response_check
  CHECK (user_response IN ('accepted', 'dismissed', 'ignored'));
