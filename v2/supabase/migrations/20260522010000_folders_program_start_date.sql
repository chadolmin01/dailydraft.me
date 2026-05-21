-- folders.program_start_date — 프로그램 시작일.
-- 진행도 매트릭스가 현재 주차를 계산해 late / pending / empty 를 구분할 때 사용.
--
-- 선택 컬럼 — null 이면 매트릭스는 단순 done / empty 만 (기존 동작 유지).

ALTER TABLE public.folders
  ADD COLUMN IF NOT EXISTS program_start_date DATE;

COMMENT ON COLUMN public.folders.program_start_date IS
  '프로그램 시작일. 매트릭스가 (오늘 - 시작일) / 7 으로 현재 주차를 계산해 지나간 주차는 late, 이번 주차는 pending 으로 표시.';
