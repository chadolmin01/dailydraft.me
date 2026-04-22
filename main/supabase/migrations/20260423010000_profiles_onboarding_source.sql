-- profiles.onboarding_source — 유입 경로 기록.
--
-- 목적: 온보딩 완료 후 GuideCTA 가 경로별로 다른 랜딩 안내를 보여 줄 수 있도록.
-- 또한 향후 코호트 분석 (어느 경로가 리텐션 좋은지) 근거.
--
-- 값:
--   'invite'    — 클럽 초대 링크·코드로 온 유저 (주 경로, 60~70% 추정)
--   'matching'  — 팀·프로젝트 매칭 목적으로 가입 (기존 온보딩 default)
--   'operator'  — 본인 클럽을 Draft 로 옮기러 온 운영자
--   'exploring' — 일단 둘러보러 온 유저
--   NULL        — 레거시 유저 (이전 온보딩 통과자)
--
-- check constraint 대신 application 레벨에서 enum 강제 (미래 확장 여지).

alter table public.profiles
  add column if not exists onboarding_source text;

comment on column public.profiles.onboarding_source is
  '유입 경로: invite / matching / operator / exploring. 온보딩 첫 단계에서 선택. NULL 은 이 컬럼 추가 전 완료한 레거시 유저.';

create index if not exists idx_profiles_onboarding_source on public.profiles(onboarding_source)
  where onboarding_source is not null;
