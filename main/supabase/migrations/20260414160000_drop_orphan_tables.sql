-- 고아 테이블 정리: 정의만 되고 코드에서 사용하지 않는 테이블 8개 삭제
-- team_decisions, team_resources → bot_interventions FK 참조가 있으므로 먼저 삭제

-- 1. FK 의존 테이블 먼저 삭제
DROP TABLE IF EXISTS team_decisions;       -- bot_interventions 참조
DROP TABLE IF EXISTS team_resources;       -- bot_interventions 참조
DROP TABLE IF EXISTS team_tasks;           -- team_checklists로 대체됨

-- 2. 참조 해제 후 삭제
DROP TABLE IF EXISTS bot_interventions;    -- Discord 봇 로깅 미구현

-- 3. 독립 테이블
DROP TABLE IF EXISTS comment_reports;      -- 댓글 신고 미구현
DROP TABLE IF EXISTS helpful_votes;        -- 도움됨 투표 미구현
DROP TABLE IF EXISTS interests;            -- profile_interests로 대체됨
DROP TABLE IF EXISTS institution_programs; -- 현재 스코프 밖
