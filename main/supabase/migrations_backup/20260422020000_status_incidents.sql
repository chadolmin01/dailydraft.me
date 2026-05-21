-- 공개 인시던트 이력 테이블 — /status 페이지 "최근 30일 인시던트" 섹션 실데이터화.
--
-- 투명성 기준: 생성·해결된 모든 SEV-0/SEV-1 인시던트는 공개. SEV-2/SEV-3 는 선택 공개.
-- 쓰기는 admin (platform_admins) 에게만. 읽기는 완전 공개.

create table if not exists public.status_incidents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  severity text not null check (severity in ('sev0', 'sev1', 'sev2', 'sev3')),
  status text not null default 'investigating' check (status in ('investigating', 'identified', 'monitoring', 'resolved')),
  started_at timestamptz not null default now(),
  resolved_at timestamptz,
  affected_components text[] default '{}',  -- ['database', 'auth', 'ingest', ...]
  summary text not null,  -- 1-3 문장 요약 (공개용)
  timeline jsonb default '[]'::jsonb,  -- [{ at: iso, note: "text" }, ...]
  root_cause text,  -- resolved 이후 선택 기입
  postmortem_url text,  -- 외부 blog·docs 링크 선택
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.status_incidents is
  '공개 인시던트 이력. /status 페이지에 최근 30일만 노출. SEV-0/SEV-1 은 필수 공개, SEV-2/3 는 선택.';

create index if not exists idx_status_incidents_started on public.status_incidents(started_at desc);
create index if not exists idx_status_incidents_severity on public.status_incidents(severity);

-- updated_at 자동 갱신 트리거
create or replace function public.touch_status_incidents_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_status_incidents_updated_at on public.status_incidents;
create trigger trg_status_incidents_updated_at
  before update on public.status_incidents
  for each row execute function public.touch_status_incidents_updated_at();

-- ============================================================
-- RLS
-- ============================================================
alter table public.status_incidents enable row level security;

-- 읽기 — 완전 공개 (로그인 필요 없음)
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'status_incidents_select_public') then
    create policy status_incidents_select_public on public.status_incidents
      for select
      using (true);
  end if;
end $$;

-- 쓰기 — platform_admins 만. H4 하드닝과 일관.
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'status_incidents_insert_admin') then
    create policy status_incidents_insert_admin on public.status_incidents
      for insert
      with check (is_platform_admin(auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where policyname = 'status_incidents_update_admin') then
    create policy status_incidents_update_admin on public.status_incidents
      for update
      using (is_platform_admin(auth.uid()))
      with check (is_platform_admin(auth.uid()));
  end if;
  -- DELETE 정책 없음 = 차단. 인시던트는 append-only (투명성 기준).
end $$;

-- 감사 로그 트리거
create or replace function public.log_status_incident_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_logs (actor_user_id, action, target_type, target_id, context)
    values (
      new.created_by,
      'status_incident.create',
      'incident',
      new.id,
      jsonb_build_object('severity', new.severity, 'title', new.title)
    );
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.audit_logs (actor_user_id, action, target_type, target_id, context, diff)
    values (
      auth.uid(),
      'status_incident.update',
      'incident',
      new.id,
      jsonb_build_object('status', new.status, 'severity', new.severity),
      jsonb_build_object(
        'before', jsonb_build_object('status', old.status),
        'after', jsonb_build_object('status', new.status)
      )
    );
    return new;
  end if;
  return null;
end $$;

drop trigger if exists trg_status_incident_audit on public.status_incidents;
create trigger trg_status_incident_audit
  after insert or update on public.status_incidents
  for each row execute function public.log_status_incident_change();
