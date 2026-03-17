-- Fix: opportunities type CHECK constraint 변경 + 기존 데이터 마이그레이션
-- 기존: team_building만 허용 → 변경: side_project, startup, study

-- 1. 기존 CHECK constraint 제거
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_type_check;

-- 2. 먼저 데이터 변환 (constraint 추가 전에!)
UPDATE opportunities SET type = 'startup' WHERE type = 'team_building';
UPDATE opportunities SET type = 'side_project' WHERE type IS NULL OR type = '';

-- 3. 새 CHECK constraint 추가
ALTER TABLE opportunities ADD CONSTRAINT opportunities_type_check
  CHECK (type IN ('side_project', 'startup', 'study'));

-- 4. 기본값 설정
ALTER TABLE opportunities ALTER COLUMN type SET DEFAULT 'side_project';
