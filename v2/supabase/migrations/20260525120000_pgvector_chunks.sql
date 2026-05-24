-- RAG (Retrieval-Augmented Generation) 인프라.
-- 의도: parsed_text 를 chunk 단위로 분할 + Google text-embedding-005 (768 dim) 저장.
--       Chat 의 search_file_contents tool 이 이 테이블 vector similarity 로 본문 검색.
--       기존 extracted_atoms (의미 indices) 와 보완 — atom 은 빠른 분류, chunks 는 본문 인용용.

-- pgvector extension — Supabase 는 extensions schema 에 install. 이미 enable 돼 있으면 skip.
-- 의도: type/operator class 는 schema-qualified (extensions.vector, extensions.vector_cosine_ops)
--       로 명시. Supabase 의 search_path 에 extensions 가 없으므로 unqualified 시 not found.
create extension if not exists vector with schema extensions;

-- chunk 단위 저장. embedding 차원 768 = Google text-embedding-005.
create table if not exists file_chunks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  processed_file_id uuid not null references processed_files(id) on delete cascade,
  -- chunk 순서 (0부터). 같은 파일 내 unique.
  chunk_index integer not null,
  content text not null,
  -- embedding 은 nullable — 생성 실패해도 row 는 살림 (atom 만 있어도 chat 일부 가능).
  embedding extensions.vector(768),
  token_count integer,
  created_at timestamptz not null default now(),
  unique (processed_file_id, chunk_index)
);
create index if not exists file_chunks_workspace_idx on file_chunks (workspace_id);
create index if not exists file_chunks_file_idx on file_chunks (processed_file_id);
-- HNSW 인덱스 — 100K+ rows 빠른 ANN 검색. 작은 데이터엔 sequential scan 도 OK.
-- vector_cosine_ops = cosine distance (text-embedding 표준).
create index if not exists file_chunks_embedding_idx on file_chunks
  using hnsw (embedding extensions.vector_cosine_ops);

-- RLS — workspaces.owner_id 기반 격리. processed_files / extracted_atoms 와 동일 패턴.
alter table file_chunks enable row level security;
drop policy if exists file_chunks_owner on file_chunks;
create policy file_chunks_owner on file_chunks for all
  using (workspace_id in (select id from workspaces where owner_id = auth.uid()))
  with check (workspace_id in (select id from workspaces where owner_id = auth.uid()));

-- Vector search RPC. <=> = cosine distance (값이 작을수록 의미적으로 가까움).
-- similarity = 1 - distance → 1 에 가까울수록 유사.
-- folder_id_filter 가 null 이면 전체 workspace 검색, 값 있으면 그 폴더만.
-- search_path 에 extensions 추가 — <=> operator (extensions schema 의 vector 전용) resolve 위해.
-- Supabase 의 함수는 기본적으로 public 만 search → extension 의 operator 못 찾음.
create or replace function search_file_chunks(
  query_embedding extensions.vector(768),
  workspace_id_filter uuid,
  folder_id_filter uuid default null,
  match_count int default 10
) returns table (
  chunk_id uuid,
  processed_file_id uuid,
  filename text,
  chunk_index int,
  content text,
  similarity float
) language sql stable
set search_path = public, extensions
as $$
  select
    fc.id, fc.processed_file_id, pf.filename, fc.chunk_index, fc.content,
    1 - (fc.embedding <=> query_embedding) as similarity
  from file_chunks fc
  join processed_files pf on pf.id = fc.processed_file_id
  where fc.workspace_id = workspace_id_filter
    and (folder_id_filter is null or pf.folder_id = folder_id_filter)
    and fc.embedding is not null
  order by fc.embedding <=> query_embedding
  limit match_count;
$$;

-- RPC 도 RLS 우회 (security definer 아님, language sql 은 caller 권한). RLS 가 file_chunks 에서 작동.
-- 명시: search_file_chunks 호출 시 caller 의 RLS 가 적용되므로 workspace 격리 자동 보장.
