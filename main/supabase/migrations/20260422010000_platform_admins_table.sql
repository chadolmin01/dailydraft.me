-- H4 하드닝 — is_admin JWT 클레임 의존 제거.
--
-- 배경: 현재 `user.app_metadata?.is_admin === true` 체크가 광범위. JWT 클레임은
-- Supabase 서비스 롤 또는 edge function 에서 elevate 가능성이 이론상 존재.
-- platform_admins 테이블로 전환하여 DB 단일 진실 소스 확립.
--
-- 이번 마이그레이션은 **도입 + 공존** 단계. 코드 전환은 점진적으로.
-- - 테이블·함수·초기 데이터 시딩
-- - 기존 app_metadata.is_admin 체크는 당분간 유지 (backward compat)
-- - 후속 마이그레이션에서 is_platform_admin() 호출로 전면 교체

-- ============================================================
-- 1. platform_admins 테이블
-- ============================================================
create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'superadmin')),
  notes text,  -- 권한 부여 이유·담당 범위 등 free-form 메모
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now()
);

comment on table public.platform_admins is
  '플랫폼 수준 관리자 목록. JWT app_metadata.is_admin 을 대체하는 DB 진실 소스. RLS 차단, service_role 만 쓰기.';

create index if not exists idx_platform_admins_role on public.platform_admins(role);

-- ============================================================
-- 2. is_platform_admin(uid) SECURITY DEFINER
-- ============================================================
-- RLS 정책 내에서 호출할 수 있도록 SECURITY DEFINER. search_path 고정.
create or replace function public.is_platform_admin(p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.platform_admins
    where user_id = p_user_id
  );
$$;

comment on function public.is_platform_admin is
  'platform_admins 에 등록된 유저인지 확인. RLS·API 양쪽에서 사용. SECURITY DEFINER + stable 이므로 RLS 재귀 걱정 없음.';

-- 공용 is_superadmin — role='superadmin' 만. 강화된 권한 체크용.
create or replace function public.is_platform_superadmin(p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.platform_admins
    where user_id = p_user_id and role = 'superadmin'
  );
$$;

-- ============================================================
-- 3. RLS — 표 자체는 서비스 롤만 쓰고 읽을 수 있게
-- ============================================================
alter table public.platform_admins enable row level security;

-- 자기 자신이 admin 인지 확인은 허용 (로그인 UI 에서 "나 admin?" 체크용)
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'platform_admins_select_self') then
    create policy platform_admins_select_self on public.platform_admins
      for select
      using (auth.uid() = user_id);
  end if;
end $$;

-- 쓰기는 service_role 만 — 관리자 부여는 Supabase dashboard 또는 admin API 에서만
-- (명시적 정책 미정의 = deny all)

-- ============================================================
-- 4. 초기 데이터 마이그레이션
-- ============================================================
-- auth.users 중 app_metadata.is_admin = true 인 사람을 platform_admins 에 복사.
-- 기존 JWT 기반 admin 이 DB 단계에서도 admin 으로 유지되도록 하는 backward compat.
do $$
declare
  v_record record;
begin
  for v_record in
    select id, email, raw_app_meta_data
    from auth.users
    where raw_app_meta_data->>'is_admin' = 'true'
  loop
    insert into public.platform_admins (user_id, role, notes)
    values (v_record.id, 'admin', 'auto-migrated from JWT app_metadata.is_admin on 2026-04-22')
    on conflict (user_id) do nothing;
  end loop;
end $$;

-- ============================================================
-- 5. 감사 로그 트리거
-- ============================================================
-- platform_admins 변경은 audit_logs 에 자동 기록.
create or replace function public.log_platform_admin_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_logs (actor_user_id, action, target_type, target_id, context)
    values (
      new.granted_by,
      'platform_admin.grant',
      'user',
      new.user_id,
      jsonb_build_object('role', new.role, 'notes', new.notes)
    );
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.audit_logs (actor_user_id, action, target_type, target_id, context)
    values (
      auth.uid(),
      'platform_admin.revoke',
      'user',
      old.user_id,
      jsonb_build_object('previous_role', old.role)
    );
    return old;
  end if;
  return null;
end $$;

drop trigger if exists trg_platform_admin_audit on public.platform_admins;
create trigger trg_platform_admin_audit
  after insert or delete on public.platform_admins
  for each row execute function public.log_platform_admin_change();

-- ============================================================
-- 6. 확인 / 모니터링
-- ============================================================
-- 이후 코드 측 전환 가이드:
-- Before: if (user.app_metadata?.is_admin !== true) return 401
-- After:  const { data: isAdmin } = await supabase.rpc('is_platform_admin', { p_user_id: user.id })
--         if (!isAdmin) return 401
--
-- 점진 전환을 위해 둘 다 허용하는 helper 함수도 가능:
-- async function isAdmin(supabase, user) {
--   if (user.app_metadata?.is_admin === true) return true  // JWT 폴백
--   const { data } = await supabase.rpc('is_platform_admin', { p_user_id: user.id })
--   return !!data
-- }
