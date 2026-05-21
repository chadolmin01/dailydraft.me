-- project_updates에 (opportunity_id, week_number) UNIQUE 제약 추가
-- 의도: 한 프로젝트는 주차당 1개의 업데이트만 허용
-- 중복 데이터가 있으면 최신 1개만 남기고 삭제한 뒤 제약을 건다

-- 1. 기존 중복 데이터 정리 (opportunity_id + week_number 기준, 가장 최근 created_at만 보존)
DELETE FROM project_updates
WHERE id NOT IN (
  SELECT DISTINCT ON (opportunity_id, week_number) id
  FROM project_updates
  ORDER BY opportunity_id, week_number, created_at DESC
);

-- 2. UNIQUE 제약 추가
ALTER TABLE project_updates
  ADD CONSTRAINT uq_project_updates_opp_week
  UNIQUE (opportunity_id, week_number);

COMMENT ON CONSTRAINT uq_project_updates_opp_week ON project_updates
  IS '한 프로젝트는 주차당 1개의 업데이트만 가능 (주차당 1회, 제출 후 잠금)';
