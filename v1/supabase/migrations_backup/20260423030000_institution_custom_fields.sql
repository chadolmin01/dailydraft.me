-- Layer 2 기관 커스텀 필드 — institution 별로 동적 필드를 정의하고 소속 학생이
-- 가입 시 답변. 기관 맞춤 리포트(창업교육센터 KPI) 의 소스 데이터.
--
-- 배경: memory/onboarding_progressive_collection.md Layer 2
--   "각 기관이 대시보드에서 직접 정의하는 동적 필드. 학생은 해당 기관 가입
--    시점에만 대답 (전체 가입에 안 물음). 기관별 리포트 양식 맞춤 → B2B 차별화."
--
-- 설계:
--   1. `institutions.custom_fields_schema` (jsonb) — 기관 관리자가 정의
--   2. `institution_custom_responses` — 학생별 응답 (institution_member_id 기준)
--
-- 필드 스키마 shape (jsonb):
--   [
--     { "id": "stdid", "label": "학번", "type": "text", "required": true,
--       "pattern": "^[0-9]{6,10}$", "helper": "숫자 6~10자리" },
--     { "id": "dept",  "label": "학부", "type": "select",
--       "options": ["컴퓨터공학부", "경영학부", ...] },
--     { "id": "year",  "label": "학년", "type": "number", "min": 1, "max": 6 }
--   ]
--
-- 타입 enum (UI·validation): text / textarea / number / select / multi_select / boolean / date

-- ───────────────────────────────────────────────────────────────
-- 1. institutions 에 custom_fields_schema 컬럼 추가
-- ───────────────────────────────────────────────────────────────
alter table public.institutions
  add column if not exists custom_fields_schema jsonb;

comment on column public.institutions.custom_fields_schema is
  '기관이 정의하는 동적 추가 입력 필드 스키마. 학생 가입 시 순차 노출. shape: [{id,label,type,required,...}].';

-- ───────────────────────────────────────────────────────────────
-- 2. 학생별 응답 저장 테이블
-- ───────────────────────────────────────────────────────────────
create table if not exists public.institution_custom_responses (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  -- 응답 전체를 하나의 jsonb 로 저장 — 기관별 스키마가 유연해야 하므로.
  -- shape: { "stdid": "20201234", "dept": "컴퓨터공학부", "year": 3 }
  responses jsonb not null,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 한 유저가 한 기관에 대해 하나의 응답만 (업데이트는 같은 row)
  unique (institution_id, user_id)
);

comment on table public.institution_custom_responses is
  '기관 커스텀 필드에 대한 학생 응답. institution 별 필드 스키마(custom_fields_schema) 에 매핑.';

-- 조회 인덱스
create index if not exists idx_icr_institution on public.institution_custom_responses(institution_id);
create index if not exists idx_icr_user on public.institution_custom_responses(user_id);

-- ───────────────────────────────────────────────────────────────
-- 3. RLS
-- ───────────────────────────────────────────────────────────────
alter table public.institution_custom_responses enable row level security;

-- 본인 응답 조회
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'icr_select_own') then
    create policy icr_select_own on public.institution_custom_responses
      for select using (auth.uid() = user_id);
  end if;
end $$;

-- 기관 관리자는 해당 기관 전체 응답 조회 (리포팅용)
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'icr_select_inst_admin') then
    create policy icr_select_inst_admin on public.institution_custom_responses
      for select using (
        institution_id in (
          select institution_id from public.institution_members
          where user_id = auth.uid() and role = 'admin'
        )
        or (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
      );
  end if;
end $$;

-- 본인만 insert/update
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'icr_insert_own') then
    create policy icr_insert_own on public.institution_custom_responses
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'icr_update_own') then
    create policy icr_update_own on public.institution_custom_responses
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- updated_at 자동 갱신 트리거
create or replace function update_icr_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_icr_updated_at on public.institution_custom_responses;
create trigger trg_icr_updated_at
before update on public.institution_custom_responses
for each row
execute function update_icr_updated_at();
