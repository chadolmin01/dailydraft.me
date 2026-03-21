-- 커피챗 결과 추적 컬럼 추가
ALTER TABLE coffee_chats
  ADD COLUMN IF NOT EXISTS outcome TEXT DEFAULT NULL
    CONSTRAINT coffee_chats_outcome_check CHECK (outcome IN ('team_formed', 'pending', 'no_match'));

-- 인덱스: 팀 형성 통계 조회용
CREATE INDEX IF NOT EXISTS idx_coffee_chats_outcome ON coffee_chats(outcome) WHERE outcome IS NOT NULL;
