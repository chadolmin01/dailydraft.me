-- 주간 업데이트 초안에 AI 품질 피드백 컬럼 추가
-- 승인/거절 시 운영진이 피드백을 남기면, 다음 주 AI 생성 시 프롬프트에 반영됨

ALTER TABLE IF EXISTS weekly_update_drafts
  ADD COLUMN IF NOT EXISTS feedback_score smallint,
  ADD COLUMN IF NOT EXISTS feedback_note text;

-- feedback_score: 1~5 (1=완전 수정 필요, 5=그대로 사용)
-- feedback_note: "작업 추출이 부정확함", "톤이 너무 딱딱함" 등 자유 텍스트

COMMENT ON COLUMN weekly_update_drafts.feedback_score IS 'AI 초안 품질 평가 (1~5). 승인/거절 시 운영진이 기록';
COMMENT ON COLUMN weekly_update_drafts.feedback_note IS 'AI 초안에 대한 구체적 피드백. 다음 생성 시 프롬프트에 반영됨';
