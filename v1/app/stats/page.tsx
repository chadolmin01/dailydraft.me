import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient as createAnonClient } from '@supabase/supabase-js'
import { BarChart3, TrendingUp } from 'lucide-react'

export const metadata: Metadata = {
  title: '공개 통계 · Draft',
  description:
    'Draft 플랫폼의 공개 지표(클럽·프로젝트·프로필·업데이트·대학) 현황. 10분 주기 갱신.',
  alternates: {
    canonical: '/stats',
  },
  openGraph: {
    type: 'article',
    title: '공개 통계 · Draft',
    description: '플랫폼 공개 지표 스냅샷.',
    url: '/stats',
    locale: 'ko_KR',
  },
}

export const revalidate = 600

/**
 * /stats — 공개 지표 단일 페이지.
 *
 * 기존 /trust 의 PublicMetricsStrip 과 차별:
 *   - 더 큰 숫자·설명·업데이트 타임스탬프
 *   - 각 지표의 의미를 1-2줄로 풀어씀 (비전문가도 이해 가능)
 *   - 10 미만 baseline 가드 유지
 *
 * 10분 ISR 로 캐시.
 */

interface Snapshot {
  snapshot_date: string
  clubs_public: number
  active_opportunities: number
  profiles_public: number
  weekly_updates_90d: number
  public_universities: number
}

async function fetchData() {
  const supabase = createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [clubsRes, oppsRes, profilesRes, updatesRes, universitiesRes, snapshotsRes] =
    await Promise.all([
      supabase.from('clubs').select('*', { count: 'exact', head: true }).eq('visibility', 'public'),
      supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('profile_visibility', 'public'),
      supabase.from('project_updates').select('*', { count: 'exact', head: true }).gte('created_at', ninetyDaysAgo),
      supabase.from('profiles').select('university').eq('profile_visibility', 'public').not('university', 'is', null).limit(1000),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('daily_metrics_snapshots')
        .select('snapshot_date, clubs_public, active_opportunities, profiles_public, weekly_updates_90d, public_universities')
        .gte('snapshot_date', thirtyDaysAgo)
        .order('snapshot_date', { ascending: true }),
    ])

  const uniqueUniversities = new Set(
    (universitiesRes.data ?? [])
      .map((p) => (p as { university?: string }).university)
      .filter((u): u is string => typeof u === 'string' && u.length > 0),
  ).size

  return {
    current: {
      clubs_public: clubsRes.count ?? 0,
      active_opportunities: oppsRes.count ?? 0,
      profiles_public: profilesRes.count ?? 0,
      weekly_updates_90d: updatesRes.count ?? 0,
      public_universities: uniqueUniversities,
    },
    snapshots: (snapshotsRes.data ?? []) as Snapshot[],
  }
}

export default async function StatsPage() {
  let data: Awaited<ReturnType<typeof fetchData>> | null = null
  try {
    data = await fetchData()
  } catch {
    data = null
  }

  const cards = data
    ? [
        {
          title: '공개 클럽',
          value: data.current.clubs_public,
          desc: 'visibility=public 설정으로 외부에 노출된 클럽 수.',
          field: 'clubs_public' as const,
        },
        {
          title: '활성 프로젝트',
          value: data.current.active_opportunities,
          desc: '지금 팀원·파트너를 찾고 있는 프로젝트 수.',
          field: 'active_opportunities' as const,
        },
        {
          title: '공개 프로필',
          value: data.current.profiles_public,
          desc: '본인 의사로 외부 공개된 프로필 수.',
          field: 'profiles_public' as const,
        },
        {
          title: '최근 90일 업데이트',
          value: data.current.weekly_updates_90d,
          desc: '주간 업데이트가 축적된 총량 (지난 90일).',
          field: 'weekly_updates_90d' as const,
        },
        {
          title: '연결된 대학',
          value: data.current.public_universities,
          desc: '프로필에 드러난 고유 대학 수 — 학내 다양성 지표.',
          field: 'public_universities' as const,
        },
      ]
    : []

  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <header className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={16} className="text-brand" aria-hidden="true" />
          <p className="text-[12px] font-semibold text-brand">공개 통계</p>
        </div>
        <h1 className="text-[28px] font-bold text-txt-primary tracking-tight">Draft 는 지금 이 정도입니다</h1>
        <p className="text-[14px] text-txt-secondary mt-2 leading-relaxed">
          공개된 지표의 현 시점 스냅샷입니다. 10분 주기로 갱신되며, 10 미만 지표는 과장 방지를 위해
          숨깁니다. 더 상세한 내부 지표와 API 는{' '}
          <Link href="/api-docs" className="text-brand underline">
            공개 API 문서
          </Link>
          .
        </p>
        <p className="text-[11px] text-txt-tertiary mt-2">
          최종 업데이트: 페이지 재생성 시점 (10분 ISR). 서버 시간은 UTC+9.
        </p>
      </header>

      {!data ? (
        <p className="text-[13px] text-txt-tertiary">지표를 불러오지 못했습니다.</p>
      ) : (
        <div className="space-y-4">
          {cards.map((c) => {
            if (c.value < 10) {
              return (
                <div
                  key={c.title}
                  className="bg-surface-card border border-border rounded-2xl p-5 opacity-70"
                >
                  <div className="text-[11px] font-medium text-txt-tertiary mb-1">{c.title}</div>
                  <div className="text-[22px] font-bold text-txt-tertiary">준비 중</div>
                  <p className="text-[12px] text-txt-tertiary mt-1">
                    baseline (N≥10) 이 채워지는 대로 이 자리에 숫자가 표시됩니다.
                  </p>
                </div>
              )
            }
            return (
              <div key={c.title} className="bg-surface-card border border-border rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium text-txt-tertiary mb-1">{c.title}</div>
                    <div className="text-[32px] font-bold font-mono text-txt-primary tabular-nums leading-tight">
                      {c.value.toLocaleString()}
                    </div>
                    <p className="text-[12px] text-txt-secondary mt-1 leading-relaxed">{c.desc}</p>
                  </div>
                  <TrendingUp size={16} className="text-txt-tertiary mt-1" aria-hidden="true" />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {data?.snapshots && data.snapshots.length >= 2 && (
        <p className="text-[12px] text-txt-tertiary mt-8">
          최근 30일 trend 그래프는 내부 /admin/metrics 에 있으며, 공개 버전은 준비 중입니다.
        </p>
      )}

      <footer className="mt-12 pt-8 border-t border-border text-[12px] text-txt-tertiary space-y-1">
        <p>
          개별 유저 식별 가능한 데이터는 여기에 포함되지 않습니다. 집계 카운트만 제공.
        </p>
        <p>
          관련:{' '}
          <Link href="/trust" className="text-brand underline">
            신뢰 센터
          </Link>{' '}
          ·{' '}
          <Link href="/legal/privacy" className="text-brand underline">
            개인정보처리방침
          </Link>
        </p>
      </footer>
    </main>
  )
}
