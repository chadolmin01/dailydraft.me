-- Ambient MicroPrompt 응답 로그 + 쿨다운 관리.
--
-- 배경 (memory/onboarding_progressive_collection.md Layer 4):
--   온보딩 강제 인터뷰는 제거하고, 대신 "로딩 스켈레톤·사이드 카드·세션 마감
--   blur" 같은 Ambient 지점에 1문항 위젯을 끼워 넣는다. 유저가 답하면 매칭
--   데이터에 누적되고, 누적량이 일정 이상이면 정식 인터뷰 스킵 허용.
--
-- 규칙:
--   - 한 유저가 같은 질문에 여러 번 답하지 않도록 unique(user_id, question_id)
--   - 같은 세션에서 micro-prompt 가 폭탄처럼 나오지 않도록 쿨다운 24h 기본
--   - 개별 응답 JSON 으로 저장 (interactive 위젯마다 shape 다름)

create table if not exists public.micro_prompts_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  response jsonb not null,
  -- 어떤 맥락에서 물어봤는지 (skeleton·side_card·post_detail 등)
  slot text,
  -- 세션 식별 (쿨다운 계산용, 익명 가능)
  session_key text,
  created_at timestamptz not null default now(),
  -- 같은 유저·같은 질문은 1회만 저장 (최신 값만 유지)
  unique (user_id, question_id)
);

comment on table public.micro_prompts_log is
  '온보딩 Ambient MicroPrompt 응답. 강제 인터뷰 우회 대체 수집 경로.';

-- 쿨다운 계산 인덱스 — 최근 응답 시점 조회
create index if not exists idx_micro_prompts_user_created
  on public.micro_prompts_log(user_id, created_at desc);

-- RLS — 본인 응답만 조회/쓰기 가능
alter table public.micro_prompts_log enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'micro_prompts_select_own'
  ) then
    create policy micro_prompts_select_own on public.micro_prompts_log
      for select using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'micro_prompts_insert_own'
  ) then
    create policy micro_prompts_insert_own on public.micro_prompts_log
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'micro_prompts_update_own'
  ) then
    create policy micro_prompts_update_own on public.micro_prompts_log
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
