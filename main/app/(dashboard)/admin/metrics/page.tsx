'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdmin } from '@/src/hooks/useAdmin'
import { BarChart3, TrendingUp, Loader2, Users, Briefcase, Building2, GraduationCap, FileText, Coffee, Eye, UserPlus } from 'lucide-react'

/**
 * /admin/metrics — Platform KPI 대시보드.
 *
 * Bundle AdminMetrics-Dashboard.
 *
 * 특징:
 *   - /api/admin/metrics 에서 현 시점 집계 + 최근 30일 snapshots + 7d/30d delta
 *   - 스파크라인(순수 SVG, 라이브러리 없음) 5개 지표 시각화
 *   - 평범한 internal 관찰용 — 공개 /trust 페이지와는 지표 종류가 다름 (total_users 등 비공개 수치 포함)
 */

interface MetricsPayload {
  current: {
    clubs_public: number
    opportunities_active: number
    opportunities_total: number
    profiles_public: number
    weekly_updates_90d: number
    public_universities: number
    total_users: number
    new_users_7d: number
    total_applications: number
    total_coffee_chats: number
    total_views: number
  }
  snapshots: Array<{
    snapshot_date: string
    clubs_public: number
    active_opportunities: number
    profiles_public: number
    weekly_updates_90d: number
    public_universities: number
  }>
  deltas: {
    d7: { clubs_public: number; opportunities_active: number; profiles_public: number; weekly_updates_90d: number; public_universities: number; since: string } | null
    d30: { clubs_public: number; opportunities_active: number; profiles_public: number; weekly_updates_90d: number; public_universities: number; since: string } | null
  }
  fetched_at: string
}

export default function AdminMetricsPage() {
  const router = useRouter()
  const { isAdmin, isLoading: adminLoading } = useAdmin()
  const [data, setData] = useState<MetricsPayload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!adminLoading && !isAdmin) router.push('/explore')
  }, [adminLoading, isAdmin, router])

  useEffect(() => {
    if (!isAdmin) return
    fetch('/api/admin/metrics', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        setData((d.data ?? d) as MetricsPayload)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [isAdmin])

  if (adminLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-txt-tertiary" size={24} /></div>
  }
  if (!isAdmin) return null

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8">
      <div className="border-b border-border pb-6">
        <div className="text-[10px] font-medium text-txt-tertiary mb-2 flex items-center gap-2">
          <BarChart3 size={14} />
          Admin / Metrics
        </div>
        <h1 className="text-3xl font-bold text-txt-primary tracking-tight">플랫폼 KPI</h1>
        <p className="text-txt-tertiary text-sm mt-1">
          현 시점 지표 + 최근 30일 스냅샷 trend. 매일 자정 (UTC+9) cron 으로 기록됩니다.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 skeleton-shimmer rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[0, 1].map((i) => <div key={i} className="h-64 skeleton-shimmer rounded-2xl" />)}
          </div>
        </div>
      ) : !data ? (
        <p className="text-[13px] text-txt-tertiary">데이터를 불러오지 못했습니다.</p>
      ) : (
        <>
          {/* 유저·가입 */}
          <section>
            <h2 className="text-[10px] font-medium text-txt-tertiary mb-3 flex items-center gap-2">
              <Users size={12} />
              유저 · 가입
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="Total users" value={data.current.total_users} icon={Users} />
              <KpiCard label="New users (7d)" value={data.current.new_users_7d} icon={UserPlus} />
              <KpiCard label="Public profiles" value={data.current.profiles_public} icon={Users} delta={data.deltas.d7?.profiles_public} deltaLabel="vs 7d 전" />
              <KpiCard label="Public universities" value={data.current.public_universities} icon={GraduationCap} delta={data.deltas.d7?.public_universities} deltaLabel="vs 7d 전" />
            </div>
          </section>

          {/* 프로젝트·활동 */}
          <section>
            <h2 className="text-[10px] font-medium text-txt-tertiary mb-3 flex items-center gap-2">
              <Briefcase size={12} />
              프로젝트 · 활동
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="Active opportunities" value={data.current.opportunities_active} icon={Briefcase} delta={data.deltas.d7?.opportunities_active} deltaLabel="vs 7d 전" />
              <KpiCard label="Total opportunities" value={data.current.opportunities_total} icon={Briefcase} />
              <KpiCard label="Applications" value={data.current.total_applications} icon={FileText} />
              <KpiCard label="Coffee chats" value={data.current.total_coffee_chats} icon={Coffee} />
            </div>
          </section>

          {/* 클럽·콘텐츠 */}
          <section>
            <h2 className="text-[10px] font-medium text-txt-tertiary mb-3 flex items-center gap-2">
              <Building2 size={12} />
              클럽 · 콘텐츠
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="Public clubs" value={data.current.clubs_public} icon={Building2} delta={data.deltas.d7?.clubs_public} deltaLabel="vs 7d 전" />
              <KpiCard label="Weekly updates (90d)" value={data.current.weekly_updates_90d} icon={FileText} delta={data.deltas.d7?.weekly_updates_90d} deltaLabel="vs 7d 전" />
              <KpiCard label="Total views" value={data.current.total_views} icon={Eye} />
              <KpiCard label="Snapshots" value={data.snapshots.length} icon={TrendingUp} />
            </div>
          </section>

          {/* Sparkline */}
          <section>
            <h2 className="text-[10px] font-medium text-txt-tertiary mb-3 flex items-center gap-2">
              <TrendingUp size={12} />
              최근 30일 Trend
            </h2>
            {data.snapshots.length < 2 ? (
              <div className="bg-surface-card border border-border rounded-2xl p-10 text-center">
                <p className="text-[13px] font-semibold text-txt-primary mb-1">스냅샷 2개 이상 필요</p>
                <p className="text-[12px] text-txt-tertiary">일별 스냅샷 cron 이 매일 자정 기록합니다. 첫 trend 는 내일 표시됩니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SparkCard title="Public clubs" snapshots={data.snapshots} field="clubs_public" />
                <SparkCard title="Active opportunities" snapshots={data.snapshots} field="active_opportunities" />
                <SparkCard title="Public profiles" snapshots={data.snapshots} field="profiles_public" />
                <SparkCard title="Weekly updates (90d)" snapshots={data.snapshots} field="weekly_updates_90d" />
              </div>
            )}
          </section>

          <p className="text-[11px] text-txt-tertiary pt-6 border-t border-border-subtle">
            Fetched at {new Date(data.fetched_at).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'medium' })}.
            스냅샷은 매일 자정 (UTC+9) 에 한 번 기록됩니다 — 내부 운영용 지표이며 /trust 공개 지표와 일부 필드가 중첩됩니다.
          </p>
        </>
      )}
    </div>
  )
}

function KpiCard({
  label,
  value,
  icon: Icon,
  delta,
  deltaLabel,
}: {
  label: string
  value: number
  icon: typeof Users
  delta?: number | null
  deltaLabel?: string
}) {
  return (
    <div className="bg-surface-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 text-[10px] font-medium text-txt-tertiary mb-2">
        <Icon size={11} />
        {label}
      </div>
      <div className="text-2xl font-bold font-mono text-txt-primary tabular-nums">{value.toLocaleString()}</div>
      {typeof delta === 'number' && delta !== 0 && (
        <div className={`mt-1 text-[11px] font-semibold tabular-nums ${delta > 0 ? 'text-status-success-text' : 'text-status-danger-text'}`}>
          {delta > 0 ? '+' : ''}{delta.toLocaleString()} <span className="text-txt-tertiary font-normal">{deltaLabel}</span>
        </div>
      )}
    </div>
  )
}

function SparkCard({
  title,
  snapshots,
  field,
}: {
  title: string
  snapshots: Array<Record<string, number | string>>
  field: 'clubs_public' | 'active_opportunities' | 'profiles_public' | 'weekly_updates_90d' | 'public_universities'
}) {
  const values = snapshots.map((s) => Number(s[field] ?? 0))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const W = 400
  const H = 80
  const P = 4
  const points = values.map((v, i) => {
    const x = (i / Math.max(values.length - 1, 1)) * (W - P * 2) + P
    const y = H - P - ((v - min) / range) * (H - P * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  const first = values[0] ?? 0
  const last = values[values.length - 1] ?? 0
  const diff = last - first
  const pct = first === 0 ? null : ((diff / first) * 100)

  return (
    <div className="bg-surface-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-semibold text-txt-primary">{title}</h3>
        <div className="text-[11px] font-mono tabular-nums text-txt-tertiary">
          {first.toLocaleString()} → {last.toLocaleString()}
          {pct !== null && (
            <span className={`ml-2 font-bold ${diff >= 0 ? 'text-status-success-text' : 'text-status-danger-text'}`}>
              {diff >= 0 ? '+' : ''}{pct.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20" preserveAspectRatio="none" role="img" aria-label={`${title} 30일 추이`}>
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-brand"
        />
      </svg>
      <div className="flex items-center justify-between text-[10px] text-txt-tertiary mt-2">
        <span>{snapshots[0]?.snapshot_date}</span>
        <span>{snapshots[snapshots.length - 1]?.snapshot_date}</span>
      </div>
    </div>
  )
}
