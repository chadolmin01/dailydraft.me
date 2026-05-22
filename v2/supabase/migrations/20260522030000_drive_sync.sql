-- Drive 동기화 + 파일 처리 결과 저장 — V1 워크스페이스에 종속.
-- M6 atoms/files 테이블은 multi-tenant 가정 (tenant_id NOT NULL) 이라 PoC 에 무겁다.
-- 가벼운 workspace-scoped 미러를 둠. 이후 multi-tenant 로 갈 때 atoms 로 이관 가능.

-- folders 에 마지막 동기화 시각 추가 — cron 이 increment scan 할 때 기준.
alter table folders
  add column if not exists last_synced_at timestamptz;

-- 처리된 파일 (Drive 바이너리 → 텍스트 파싱 완료 단위)
create table if not exists processed_files (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  folder_id uuid references folders(id) on delete cascade,
  drive_file_id text not null,
  filename text not null,
  mime_type text not null,
  size_bytes bigint,
  drive_modified_at timestamptz,
  parsed_text text,
  parsing_completed_at timestamptz,
  parsing_error text,
  atom_count integer not null default 0,
  relation_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 같은 워크스페이스 안에서 같은 Drive 파일 1번만 처리 (재처리 시 update)
  unique (workspace_id, drive_file_id)
);
create index if not exists processed_files_workspace_idx on processed_files (workspace_id);
create index if not exists processed_files_folder_idx on processed_files (folder_id);
create index if not exists processed_files_pending_idx on processed_files (workspace_id)
  where parsing_completed_at is null;

-- 추출된 Atom — M6 v1.1 의 12 AtomType. provenance/confidence 보존.
create table if not exists extracted_atoms (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  processed_file_id uuid not null references processed_files(id) on delete cascade,
  -- LLM 응답에서의 local id (R1, D2 등). relation 연결 키.
  local_id text not null,
  type text not null check (
    type in ('Requirement', 'Deadline', 'Constraint',
             'Deliverable', 'Metric', 'Narrative',
             'Event', 'Question', 'Decision',
             'Reference', 'Definition', 'Entity')
  ),
  content text not null check (length(content) <= 500),
  attributes jsonb not null default '{}',
  provenance jsonb not null,
  confidence numeric(3,2) not null check (confidence between 0 and 1),
  created_at timestamptz not null default now(),
  unique (processed_file_id, local_id)
);
create index if not exists extracted_atoms_workspace_idx on extracted_atoms (workspace_id);
create index if not exists extracted_atoms_file_idx on extracted_atoms (processed_file_id);
create index if not exists extracted_atoms_type_idx on extracted_atoms (workspace_id, type);

-- 추출된 Relation
create table if not exists extracted_relations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  processed_file_id uuid not null references processed_files(id) on delete cascade,
  from_atom_id uuid not null references extracted_atoms(id) on delete cascade,
  to_atom_id uuid not null references extracted_atoms(id) on delete cascade,
  type text not null check (
    type in ('requires', 'fulfills', 'references',
             'assigned_to', 'produced_by', 'temporally_after',
             'responds_to', 'triggers', 'approves', 'evolves_to')
  ),
  confidence numeric(3,2) not null check (confidence between 0 and 1),
  created_at timestamptz not null default now(),
  constraint no_self_relation check (from_atom_id != to_atom_id)
);
create index if not exists extracted_relations_workspace_idx on extracted_relations (workspace_id);
create index if not exists extracted_relations_file_idx on extracted_relations (processed_file_id);

-- RLS — workspace 소유자만 접근.
alter table processed_files enable row level security;
alter table extracted_atoms enable row level security;
alter table extracted_relations enable row level security;

drop policy if exists processed_files_owner on processed_files;
create policy processed_files_owner on processed_files for all
  using (workspace_id in (select id from workspaces where owner_id = auth.uid()))
  with check (workspace_id in (select id from workspaces where owner_id = auth.uid()));

drop policy if exists extracted_atoms_owner on extracted_atoms;
create policy extracted_atoms_owner on extracted_atoms for all
  using (workspace_id in (select id from workspaces where owner_id = auth.uid()))
  with check (workspace_id in (select id from workspaces where owner_id = auth.uid()));

drop policy if exists extracted_relations_owner on extracted_relations;
create policy extracted_relations_owner on extracted_relations for all
  using (workspace_id in (select id from workspaces where owner_id = auth.uid()))
  with check (workspace_id in (select id from workspaces where owner_id = auth.uid()));

-- service_role 은 RLS 우회하지만, 명시적 GRANT 필요 (다른 migration 들과 동일 패턴)
grant all on processed_files to service_role;
grant all on extracted_atoms to service_role;
grant all on extracted_relations to service_role;
