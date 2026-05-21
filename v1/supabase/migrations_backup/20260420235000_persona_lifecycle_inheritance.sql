-- ============================================================
-- Persona Lifecycle + Selective Inheritance (2026-04-20)
-- ============================================================
-- 프로젝트 페르소나 도입에 따른 스키마 확장:
--   1) inherit_from_parent — 자식 페르소나가 부모 필드를 AI 생성 시 참고할지
--      토글. 기본 true (대부분의 유저가 켜둠). false 면 완전 독립.
--   2) archived_at          — 기수 종료·수동 아카이브 시각 기록.
--   3) term_end_at          — 프로젝트 기수 종료 예정일. 이 시각 도래 시
--      cron (또는 프로젝트 status 변경 트리거) 이 status='archived' 로 전환.
--
-- can_view_persona 는 이미 active/archived 상태를 공개로 처리하므로
-- 별도 수정 불필요 (클럽 ops 는 자연스럽게 열람 가능).
-- ============================================================

ALTER TABLE personas
  ADD COLUMN IF NOT EXISTS inherit_from_parent boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS term_end_at timestamptz;

COMMENT ON COLUMN personas.inherit_from_parent IS
  '부모 페르소나 필드를 AI 생성 시 참고할지. project/personal 에서만 의미. 기본 true';
COMMENT ON COLUMN personas.archived_at IS
  'term_end_at 도래 또는 수동 아카이브 시각. status=archived 진입 시 함께 세팅';
COMMENT ON COLUMN personas.term_end_at IS
  '프로젝트 기수 종료 예정일. NULL 이면 자동 아카이브 없음';

-- 자동 아카이브 cron 에서 빠르게 찾기 위한 부분 인덱스
CREATE INDEX IF NOT EXISTS idx_personas_term_end
  ON personas(term_end_at)
  WHERE term_end_at IS NOT NULL AND status <> 'archived';
