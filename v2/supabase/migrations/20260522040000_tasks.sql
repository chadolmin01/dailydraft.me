-- 매니저 운영 업무 (task) — 폴더와 별도 (선택적으로 폴더 연결).
-- 상태: backlog (대기) → in_progress (진행 중) → done (완료).
-- 의도: V1 진행 상황 탭의 Kanban + 백로그.

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  folder_id uuid references folders(id) on delete set null,
  title text not null check (length(title) between 1 and 200),
  description text check (length(description) <= 2000),
  status text not null default 'backlog' check (status in ('backlog', 'in_progress', 'done')),
  due_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  position integer not null default 0
);

create index if not exists tasks_workspace_idx on tasks (workspace_id);
create index if not exists tasks_workspace_status_idx on tasks (workspace_id, status, position);
create index if not exists tasks_folder_idx on tasks (folder_id) where folder_id is not null;
create index if not exists tasks_due_idx on tasks (workspace_id, due_at) where due_at is not null and status != 'done';

-- updated_at 자동 갱신
create or replace function set_tasks_updated_at() returns trigger
  language plpgsql as $$
begin
  new.updated_at = now();
  if old.status != 'done' and new.status = 'done' and new.completed_at is null then
    new.completed_at = now();
  end if;
  if new.status != 'done' then
    new.completed_at = null;
  end if;
  return new;
end;
$$;
drop trigger if exists tasks_updated_at on tasks;
create trigger tasks_updated_at before update on tasks
  for each row execute function set_tasks_updated_at();

-- RLS — workspace owner 만
alter table tasks enable row level security;
drop policy if exists tasks_owner on tasks;
create policy tasks_owner on tasks for all
  using (workspace_id in (select id from workspaces where owner_id = auth.uid()))
  with check (workspace_id in (select id from workspaces where owner_id = auth.uid()));

grant all on tasks to service_role;
