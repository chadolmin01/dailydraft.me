-- Meta(Threads/Instagram) 데이터 삭제 요청 추적 테이블.
-- /api/oauth/threads/data-deletion 로 들어오는 signed_request 를 받으면
-- 여기에 confirmation_code 와 함께 기록하고, status URL 에서 조회하게 함.
-- Meta 앱 리뷰 제출 시 "데이터 삭제 프로세스가 검증 가능한가" 기준을 충족시키기 위함.

create table if not exists public.meta_data_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  confirmation_code text not null unique,
  provider text not null check (provider in ('threads', 'instagram', 'facebook')),
  external_user_id text not null,
  status text not null default 'accepted' check (status in ('accepted', 'processing', 'completed', 'failed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists meta_data_deletion_requests_code_idx
  on public.meta_data_deletion_requests (confirmation_code);

create index if not exists meta_data_deletion_requests_external_idx
  on public.meta_data_deletion_requests (provider, external_user_id);

-- RLS: 일반 클라이언트 접근 금지. 서비스 롤(admin)만 사용.
alter table public.meta_data_deletion_requests enable row level security;
