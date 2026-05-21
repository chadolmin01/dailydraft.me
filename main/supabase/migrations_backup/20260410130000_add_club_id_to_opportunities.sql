-- opportunities에 club_id, cohort 추가
-- 프로젝트가 어떤 동아리의 어떤 기수에서 나왔는지 연결
-- nullable: 기존 프로젝트는 동아리 소속이 아닐 수 있음

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS club_id uuid REFERENCES clubs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cohort text;

CREATE INDEX IF NOT EXISTS idx_opportunities_club ON opportunities(club_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_club_cohort ON opportunities(club_id, cohort);
