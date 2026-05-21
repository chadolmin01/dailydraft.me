-- Legacy clubs verified 상태 재보증
--
-- 배경: 20260423040000 에서 기존 clubs 를 'verified' 로 backfill 하도록
-- UPDATE 쿼리 포함했으나, 일부 클럽 (FLIP 등) 이 여전히 'pending' 으로 남아
-- 공개 /clubs 디렉터리에서 안 보이는 문제 보고됨.
--
-- 해결: verification_submitted_at IS NULL 인 클럽은 "인증 신청 없이 존재하는
-- 레거시" 이므로 claim_status 와 무관하게 'verified' 로 강제 세팅.
-- 신청 접수 이후 (submitted_at NOT NULL) 클럽은 건드리지 않음 — admin 검토 흐름 보호.

UPDATE clubs
  SET claim_status = 'verified'
  WHERE verification_submitted_at IS NULL
    AND claim_status <> 'verified';

-- 기존 클럽이 공개 목록에 다시 나타나야 신뢰 시그널 유지.
