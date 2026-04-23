-- profiles.current_situation check constraint 업데이트.
--
-- 배경: 2026-04-23 온보딩 재설계에서 SITUATION_OPTIONS 의 value 들을 변경했으나
-- 대응하는 DB constraint 마이그레이션이 누락되어 /api/onboarding/complete 가
-- "profiles_current_situation_check" 위반으로 500 에러 발생.
--
-- 변경 내용:
--   기존 4개 값: 'solo_want_team', 'has_project_need_member', 'want_to_join', 'just_curious'
--   새로운 FE 값: 'has_project', 'want_to_join', 'solo', 'exploring'
--   → 두 세트 모두 허용 + NULL 허용. 레거시 프로덕션 데이터(있다면) 보존.
--
-- 의도: drop 후 재생성 순서를 한 트랜잭션으로. check constraint 교체는 대부분 즉시 완료.
-- 만약 constraint 이름이 다른 환경에서 다르게 지정됐다면 drop 시 skip (NOT VALID 가드).

do $$
begin
  -- 기존 constraint 제거 (이름 고정 불가능성 대비해 존재 여부 체크)
  if exists (
    select 1 from pg_constraint
    where conname = 'profiles_current_situation_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles drop constraint profiles_current_situation_check;
  end if;
end $$;

alter table public.profiles
  add constraint profiles_current_situation_check
  check (
    current_situation is null
    or current_situation in (
      -- 신규 FE 값 (2026-04-23 이후)
      'has_project',
      'want_to_join',
      'solo',
      'exploring',
      -- 레거시 값 — 이미 저장된 프로덕션 데이터 보존 용
      'solo_want_team',
      'has_project_need_member',
      'just_curious'
    )
  );

comment on constraint profiles_current_situation_check on public.profiles is
  '2026-04-23 온보딩 재설계 값 + 레거시 값 모두 허용. 향후 레거시 값을 신규 값으로 마이그레이션 후 제거 예정.';
