-- ============================================================================
-- M6 Supabase Schema v1.1
-- Aligned with M6_Glossary_v1.1.md
--
-- Naming follows glossary.ts conventions:
--   - atoms, atom_relations, files, file_series, output_rules, outputs, tenants
--   - tenant_id on every domain table (RLS scope)
--   - provenance as jsonb (matches Provenance interface)
-- ============================================================================

-- pgvector for embedding-based linking
create extension if not exists vector;
create extension if not exists pgcrypto; -- for gen_random_uuid()

-- ============================================================================
-- Tier 3 — Tenant
-- ============================================================================

create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Tier 4 — File Layer
-- ============================================================================

create table file_series (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  series_name text not null,
  detected_by text not null check (detected_by in ('pattern', 'manual')),
  created_at timestamptz not null default now()
);

create index file_series_tenant_idx on file_series (tenant_id);

create table files (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  filename text not null,
  mime_type text not null,
  size_bytes bigint not null,
  uploaded_at timestamptz not null default now(),
  uploaded_by uuid not null,  -- references auth.users(id) in real Supabase
  series_id uuid references file_series(id) on delete set null,
  series_position integer,
  category text check (
    category in ('공문', '사업계획서', '실적보고서', '회의록',
                 '정산서류', '규정/지침', '공지/안내', '기타')
  ),
  storage_url text not null,

  -- parsed text and structural metadata (filled after Parsing phase)
  parsed_text text,
  parsed_metadata jsonb,
  parsing_completed_at timestamptz,

  constraint series_position_requires_series check (
    (series_id is null and series_position is null) or
    (series_id is not null and series_position is not null)
  )
);

create index files_tenant_idx on files (tenant_id);
create index files_series_idx on files (series_id, series_position);
create index files_category_idx on files (tenant_id, category);

-- ============================================================================
-- Tier 1 — Atoms (the core entity)
-- ============================================================================

create table atoms (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,

  -- Tier 1 fields
  type text not null check (
    type in ('Requirement', 'Deadline', 'Constraint',
             'Deliverable', 'Metric', 'Narrative',
             'Event', 'Question', 'Decision',
             'Reference', 'Definition', 'Entity')
  ),
  content text not null check (length(content) <= 500),
  attributes jsonb not null default '{}',

  -- Tier 4 Provenance (required)
  provenance jsonb not null,
  -- Provenance structure (enforced at app layer):
  -- {
  --   "source": { "file_id": "uuid", "location": "page 3", "raw_text": "..." },
  --   "extracted_by": { "model": "...", "extractor_version": "...", "extracted_at": "..." }
  -- }

  -- Tier 6 Reliability
  confidence numeric(3,2) not null check (confidence between 0 and 1),
  status text not null default 'active' check (
    status in ('active', 'pending_review', 'superseded', 'rejected')
  ),

  -- Time-evolution support
  series_atom_id uuid,  -- atoms that share this ID are the same concept evolving
  valid_from timestamptz,
  valid_to timestamptz,

  -- Embedding for similarity-based Linking
  embedding vector(1536),  -- adjust dimension to match model (text-embedding-3-large is 3072, small is 1536)

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint validity_range check (
    valid_from is null or valid_to is null or valid_from <= valid_to
  )
);

create index atoms_tenant_idx on atoms (tenant_id);
create index atoms_type_idx on atoms (tenant_id, type);
create index atoms_status_idx on atoms (tenant_id, status);
create index atoms_series_idx on atoms (series_atom_id) where series_atom_id is not null;
create index atoms_validity_idx on atoms (tenant_id, valid_from, valid_to);

-- pgvector index for similarity search (IVFFlat for moderate scale)
create index atoms_embedding_idx on atoms
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Atom → File quick lookup via provenance
create index atoms_provenance_file_idx on atoms
  using gin ((provenance -> 'source' -> 'file_id'));

-- ============================================================================
-- Tier 1 — Atom Relations
-- ============================================================================

create table atom_relations (
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

create index atom_relations_tenant_idx on atom_relations (tenant_id);
create index atom_relations_from_idx on atom_relations (from_atom_id);
create index atom_relations_to_idx on atom_relations (to_atom_id);
create index atom_relations_type_idx on atom_relations (tenant_id, type);

-- ============================================================================
-- Tier 2 — Rule and Output
-- ============================================================================

create table output_rules (
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

create index output_rules_tenant_idx on output_rules (tenant_id);

create table outputs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  rule_id uuid not null references output_rules(id) on delete restrict,
  rule_version integer not null,
  content text not null,
  citations jsonb not null default '[]',
  -- citations structure: [{ "claim_id": "...", "atom_ids": ["...", "..."] }, ...]
  composed_at timestamptz not null default now(),
  composed_by uuid not null
);

create index outputs_tenant_idx on outputs (tenant_id);
create index outputs_rule_idx on outputs (rule_id);

-- ============================================================================
-- Row Level Security (RLS) — tenant isolation
-- ============================================================================

alter table tenants enable row level security;
alter table file_series enable row level security;
alter table files enable row level security;
alter table atoms enable row level security;
alter table atom_relations enable row level security;
alter table output_rules enable row level security;
alter table outputs enable row level security;

-- Helper: get current tenant from JWT claim
-- In production, this would read from auth.jwt() -> 'tenant_id'
-- For PoC we use a session variable
create or replace function current_tenant_id() returns uuid
  language sql stable
as $$
  select coalesce(
    nullif(current_setting('app.tenant_id', true), '')::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$;

-- Policy: every table only shows rows matching current tenant
create policy tenant_isolation on file_series
  using (tenant_id = current_tenant_id());
create policy tenant_isolation on files
  using (tenant_id = current_tenant_id());
create policy tenant_isolation on atoms
  using (tenant_id = current_tenant_id());
create policy tenant_isolation on atom_relations
  using (tenant_id = current_tenant_id());
create policy tenant_isolation on output_rules
  using (tenant_id = current_tenant_id());
create policy tenant_isolation on outputs
  using (tenant_id = current_tenant_id());

-- Tenants table: users can only see their own tenant
create policy tenant_self on tenants
  using (id = current_tenant_id());

-- ============================================================================
-- Triggers
-- ============================================================================

create or replace function set_updated_at() returns trigger
  language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger atoms_updated_at
  before update on atoms
  for each row execute function set_updated_at();

-- ============================================================================
-- Convenience Views
-- ============================================================================

-- Active atoms only (excludes superseded, rejected)
create view active_atoms as
  select * from atoms
  where status = 'active'
    and (valid_to is null or valid_to > now());

-- Triples view — joins relations with both endpoint atoms
create view triples as
  select
    r.id as relation_id,
    r.tenant_id,
    r.type as predicate,
    r.confidence as relation_confidence,
    a_from.id as subject_id,
    a_from.type as subject_type,
    a_from.content as subject_content,
    a_to.id as object_id,
    a_to.type as object_type,
    a_to.content as object_content
  from atom_relations r
  join atoms a_from on a_from.id = r.from_atom_id
  join atoms a_to on a_to.id = r.to_atom_id;

-- ============================================================================
-- Schema Version Stamp
-- ============================================================================

create table schema_version (
  version text primary key,
  glossary_version text not null,
  applied_at timestamptz not null default now()
);

insert into schema_version (version, glossary_version)
  values ('1.1.0', '1.1');
