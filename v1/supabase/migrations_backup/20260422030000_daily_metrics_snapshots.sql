-- 일별 공개 지표 스냅샷 — /api/metrics/public 의 trend 계산용.
--
-- 매일 자정(UTC+9 = 15:00 UTC) cron 이 현 시점 지표를 한 row 로 insert.
-- 랜딩 LiveMetrics 에서 "이번 달 +N" 같은 증감 표현 가능.
--
-- 개별 유저 식별 없음. 집계 카운트만 저장.

create table if not exists public.daily_metrics_snapshots (
  snapshot_date date primary key,  -- YYYY-MM-DD (UTC+9 기준)
  clubs_public int not null default 0,
  active_opportunities int not null default 0,
  profiles_public int not null default 0,
  weekly_updates_90d int not null default 0,
  public_universities int not null default 0,
  captured_at timestamptz not null default now()
);

comment on table public.daily_metrics_snapshots is
  '일별 공개 지표 스냅샷. 집계 카운트만. /api/metrics/public trend 계산·랜딩 LiveMetrics 증감 표시에 사용.';

create index if not exists idx_daily_metrics_captured on public.daily_metrics_snapshots(captured_at desc);

-- RLS — 읽기 public, 쓰기 service_role 만 (cron 에서 admin client 로 insert)
alter table public.daily_metrics_snapshots enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'daily_metrics_select_public') then
    create policy daily_metrics_select_public on public.daily_metrics_snapshots
      for select using (true);
  end if;
end $$;
-- 쓰기 정책 없음 = service_role 만.
