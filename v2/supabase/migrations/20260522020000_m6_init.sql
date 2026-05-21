-- M6 Glossary v1.1 스키마 — glossary/schema.sql 의 Supabase 마이그레이션 버전.
-- IF NOT EXISTS 추가 (재실행 가능). V1 (workspaces/folders/chats/google_tokens) 와 공존.

-- pgvector 는 Supabase Dashboard → Database → Extensions 에서 enable 후 별도 마이그레이션.
-- 현재는 embedding 컬럼 없이 atoms 생성 (Linking phase 구현 시 ALTER TABLE 로 추가).
create extension if not exists pgcrypto;

-- Tier 3 — Tenant
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Tier 4 — File Layer
create table if not exists file_series (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  series_name text not null,
  detected_by text not null check (detected_by in ('pattern', 'manual')),
  created_at timestamptz not null default now()
);
create index if not exists file_series_tenant_idx on file_series (tenant_id);

create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  filename text not null,
  mime_type text not null,
  size_bytes bigint not null,
  uploaded_at timestamptz not null default now(),
  uploaded_by uuid not null,
  series_id uuid references file_series(id) on delete set null,
  series_position integer,
  category text check (
    category in ('공문', '사업계획서', '실적보고서', '회의록',
                 '정산서류', '규정/지침', '공지/안내', '기타')
  ),
  storage_url text not null,
  parsed_text text,
  parsed_metadata jsonb,
  parsing_completed_at timestamptz,
  constraint series_position_requires_series check (
    (series_id is null and series_position is null) or
    (series_id is not null and series_position is not null)
  )
);
create index if not exists files_tenant_idx on files (tenant_id);
create index if not exists files_series_idx on files (series_id, series_position);
create index if not exists files_category_idx on files (tenant_id, category);

-- Tier 1 — Atoms
create table if not exists atoms (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
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
  status text not null default 'active' check (
    status in ('active', 'pending_review', 'superseded', 'rejected')
  ),
  series_atom_id uuid,
  valid_from timestamptz,
  valid_to timestamptz,
  -- embedding vector(1536), -- pgvector 도입 후 ALTER TABLE
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint validity_range check (
    valid_from is null or valid_to is null or valid_from <= valid_to
  )
);
create index if not exists atoms_tenant_idx on atoms (tenant_id);
create index if not exists atoms_type_idx on atoms (tenant_id, type);
create index if not exists atoms_status_idx on atoms (tenant_id, status);
create index if not exists atoms_series_idx on atoms (series_atom_id) where series_atom_id is not null;
create index if not exists atoms_validity_idx on atoms (tenant_id, valid_from, valid_to);
-- create index if not exists atoms_embedding_idx ... (pgvector 도입 후)
create index if not exists atoms_provenance_file_idx on atoms
  using gin ((provenance -> 'source' -> 'file_id'));

-- Tier 1 — Atom Relations
create table if not exists atom_relations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  from_atom_id uuid not null references atoms(id) on delete cascade,
  to_atom_id uuid not null references atoms(id) on delete cascade,
  type text not null check (
    type in ('requires', 'fulfills', 'references',
             'assigned_to', 'produced_by', 'temporally_after',
             'responds_to', 'triggers', 'approves', 'evolves_to')
  ),
  confidence numeric(3,2) not null check (confidence between 0 and 1),
  extracted_by text not null check (extracted_by in ('llm', 'human', 'rule')),
  created_at timestamptz not null default now(),
  constraint no_self_relation check (from_atom_id != to_atom_id),
  unique (tenant_id, from_atom_id, to_atom_id, type)
);
create index if not exists atom_relations_tenant_idx on atom_relations (tenant_id);
create index if not exists atom_relations_from_idx on atom_relations (from_atom_id);
create index if not exists atom_relations_to_idx on atom_relations (to_atom_id);
create index if not exists atom_relations_type_idx on atom_relations (tenant_id, type);

-- Tier 2 — Rule and Output
create table if not exists output_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  description text not null,
  yaml_definition text not null,
  code_module text,
  prompt_template text,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  unique (tenant_id, name, version)
);
create index if not exists output_rules_tenant_idx on output_rules (tenant_id);

create table if not exists outputs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  rule_id uuid not null references output_rules(id) on delete restrict,
  rule_version integer not null,
  content text not null,
  citations jsonb not null default '[]',
  composed_at timestamptz not null default now(),
  composed_by uuid not null
);
create index if not exists outputs_tenant_idx on outputs (tenant_id);
create index if not exists outputs_rule_idx on outputs (rule_id);

-- RLS
alter table tenants enable row level security;
alter table file_series enable row level security;
alter table files enable row level security;
alter table atoms enable row level security;
alter table atom_relations enable row level security;
alter table output_rules enable row level security;
alter table outputs enable row level security;

create or replace function current_tenant_id() returns uuid
  language sql stable as $$
  select coalesce(
    nullif(current_setting('app.tenant_id', true), '')::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$;

drop policy if exists tenant_isolation on file_series;
create policy tenant_isolation on file_series for all using (tenant_id = current_tenant_id());
drop policy if exists tenant_isolation on files;
create policy tenant_isolation on files for all using (tenant_id = current_tenant_id());
drop policy if exists tenant_isolation on atoms;
create policy tenant_isolation on atoms for all using (tenant_id = current_tenant_id());
drop policy if exists tenant_isolation on atom_relations;
create policy tenant_isolation on atom_relations for all using (tenant_id = current_tenant_id());
drop policy if exists tenant_isolation on output_rules;
create policy tenant_isolation on output_rules for all using (tenant_id = current_tenant_id());
drop policy if exists tenant_isolation on outputs;
create policy tenant_isolation on outputs for all using (tenant_id = current_tenant_id());
drop policy if exists tenant_self on tenants;
create policy tenant_self on tenants for all using (id = current_tenant_id());

-- Triggers
create or replace function set_updated_at() returns trigger
  language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists atoms_updated_at on atoms;
create trigger atoms_updated_at before update on atoms
  for each row execute function set_updated_at();

-- Views
create or replace view active_atoms as
  select * from atoms where status = 'active' and (valid_to is null or valid_to > now());

create or replace view triples as
  select r.id as relation_id, r.tenant_id, r.type as predicate, r.confidence as relation_confidence,
    a_from.id as subject_id, a_from.type as subject_type, a_from.content as subject_content,
    a_to.id as object_id, a_to.type as object_type, a_to.content as object_content
  from atom_relations r
  join atoms a_from on a_from.id = r.from_atom_id
  join atoms a_to on a_to.id = r.to_atom_id;

-- Schema version
create table if not exists schema_version (
  version text primary key,
  glossary_version text not null,
  applied_at timestamptz not null default now()
);
insert into schema_version (version, glossary_version)
  values ('1.1.0', '1.1')
  on conflict (version) do nothing;

-- V1 grant 패턴 (auth/anon 차단, service_role 만 — RLS 가 추가 보호)
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all functions in schema public to service_role;
