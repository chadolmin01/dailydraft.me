'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  TrendingUp,
  Clock,
  Calendar,
  Send,
  Info,
  BarChart3,
} from 'lucide-react'
import { useClub } from '@/src/hooks/useClub'
import { usePersonaByOwner } from '@/src/hooks/usePersona'
import { usePersonaAnalytics } from '@/src/hooks/usePersonaAnalytics'
import { CHANNEL_BRANDS } from './channel-brand'
import type { ChannelFormat } from '@/src/lib/personas/types'

interface Props {
  slug: string
  embedded?: boolean
}

const PERIOD_OPTIONS = [
  { value: 7, label: '최근 7일' },
  { value: 30, label: '최근 30일' },
  { value: 90, label: '최근 90일' },
]

const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

/**
 * 성과 대시보드 (mirra 020554 패턴).
 *
 * 현재 한계: LinkedIn Analytics API / Discord 반응 수집이 아직 연동되지 않아
 * "노출·좋아요" 실측 지표는 비어 있음. 대신 DB에서 뽑을 수 있는
 * "발행 활동" 지표를 노출해, 회장이 본인들 운영 리듬을 파악할 수 있게 함.
 */
export function AnalyticsShell({ slug, embedded = false }: Props) {
  const { data: club } = useClub(slug)
  const { data: personaData } = usePersonaByOwner('club', club?.id)
  const persona = personaData?.persona

  const [days, setDays] = useState(30)
  const { data, isLoading } = usePersonaAnalytics(persona?.id, days)

  const maxHour = useMemo(() => {
    if (!data) return 0
    return Math.max(...data.hour_hist, 1)
  }, [data])

  const maxWeekday = useMemo(() => {
    if (!data) return 0
    return Math.max(...data.weekday_hist, 1)
  }, [data])

  const maxDaily = useMemo(() => {
    if (!data?.daily?.length) return 0
    return Math.max(...data.daily.map((d) => d.count), 1)
  }, [data])

  return (
    <>
      <div
        className={`flex items-start gap-3 mb-4 ${embedded ? 'justify-end' : 'justify-between'}`}
      >
        {!embedded && (
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/clubs/${slug}`}
              className="text-txt-tertiary hover:text-txt-primary transition-colors shrink-0"
              aria-label="뒤로"
            >
              <ChevronLeft size={20} />
            </Link>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-txt-primary">성과 대시보드</h1>
              <p className="text-xs text-txt-tertiary leading-relaxed">
                {club?.name ?? '우리 동아리'}에서 발행한 콘텐츠의 리듬을 분석합니다.
              </p>
            </div>
          </div>
        )}
        <div className="inline-flex items-center gap-1 bg-surface-card border border-border rounded-full p-1 shrink-0">
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p.value}
              onClick={() => setDays(p.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                days === p.value
                  ? 'bg-txt-primary text-surface-card'
                  : 'text-txt-secondary hover:text-txt-primary'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {!persona ? (
        <EmptyBlock hint="페르소나가 먼저 필요합니다." />
      ) : isLoading ? (
        <div className="space-y-4">
          <div className="h-32 rounded-2xl skeleton-shimmer" />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="h-64 rounded-2xl skeleton-shimmer" />
            <div className="h-64 rounded-2xl skeleton-shimmer" />
          </div>
        </div>
      ) : !data || data.summary.total_published === 0 ? (
        <EmptyBlock hint={`최근 ${days}일 동안 발행된 덱이 없습니다. 덱을 승인해서 채널에 올리시면 여기서 분석할 수 있습니다.`} />
      ) : (
        <div className="space-y-4">
          {/* 데이터 한계 고지 */}
          <div className="bg-brand-bg border border-brand-border rounded-xl p-4 flex gap-3">
            <Info size={16} className="text-brand shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-txt-primary mb-0.5">
                지금은 발행 활동만 집계됩니다
              </p>
              <p className="text-[11px] text-txt-secondary leading-relaxed">
                노출·좋아요·댓글 같은 외부 지표 연동은 준비 중입니다. LinkedIn·Instagram 심사 통과 후 실측 데이터가 들어오면 이 자리에 추가됩니다.
              </p>
            </div>
          </div>

          {/* KPI 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard
              label="총 발행"
              value={data.summary.total_published}
              unit="건"
              icon={<Send size={16} />}
            />
            <KpiCard
              label="일 평균"
              value={Math.round((data.summary.total_published / days) * 10) / 10}
              unit="건/일"
              icon={<Calendar size={16} />}
            />
            <KpiCard
              label="활성 채널"
              value={Object.keys(data.summary.by_channel).length}
              unit="개"
              icon={<BarChart3 size={16} />}
            />
            <KpiCard
              label="최다 발행 시간"
              value={bestHour(data.hour_hist) ?? '—'}
              unit={bestHour(data.hour_hist) !== null ? '시' : ''}
              icon={<Clock size={16} />}
            />
          </div>

          {/* 일별 타임라인 */}
          <section className="bg-surface-card border border-border rounded-2xl p-5">
            <h2 className="text-sm font-bold text-txt-primary mb-1">
              발행 타임라인
            </h2>
            <p className="text-[11px] text-txt-tertiary mb-4">
              최근 {days}일 동안 일별 발행 건수
            </p>
            <DailyBars daily={data.daily} max={maxDaily} days={days} />
          </section>

          {/* 2열: 시간대 + 요일 */}
          <div className="grid md:grid-cols-2 gap-4">
            <section className="bg-surface-card border border-border rounded-2xl p-5">
              <h2 className="text-sm font-bold text-txt-primary mb-1">
                성과가 좋은 시간대
              </h2>
              <p className="text-[11px] text-txt-tertiary mb-4">
                몇 시에 많이 발행됐는지 (KST)
              </p>
              <HourHist hist={data.hour_hist} max={maxHour} />
            </section>

            <section className="bg-surface-card border border-border rounded-2xl p-5">
              <h2 className="text-sm font-bold text-txt-primary mb-1">
                성과가 좋은 요일
              </h2>
              <p className="text-[11px] text-txt-tertiary mb-4">
                어떤 요일에 많이 발행됐는지
              </p>
              <WeekdayHist hist={data.weekday_hist} max={maxWeekday} />
            </section>
          </div>

          {/* 채널 분포 + 최근 발행 */}
          <div className="grid md:grid-cols-2 gap-4">
            <section className="bg-surface-card border border-border rounded-2xl p-5">
              <h2 className="text-sm font-bold text-txt-primary mb-3">
                채널별 분포
              </h2>
              <ul className="space-y-2">
                {Object.entries(data.summary.by_channel)
                  .sort((a, b) => b[1] - a[1])
                  .map(([ch, count]) => {
                    const brand = CHANNEL_BRANDS[ch as ChannelFormat]
                    const Icon = brand?.icon
                    const pct = Math.round(
                      (count / data.summary.total_published) * 100,
                    )
                    return (
                      <li key={ch} className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded shrink-0 min-w-[90px] ${brand?.bg ?? 'bg-surface-bg'} ${brand?.text ?? 'text-txt-tertiary'}`}
                        >
                          {Icon && <Icon size={11} />}
                          {brand?.label ?? ch}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="h-2 bg-surface-bg rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-txt-secondary shrink-0 tabular-nums">
                          {count}건
                        </span>
                        <span className="text-[10px] text-txt-tertiary shrink-0 w-8 tabular-nums text-right">
                          {pct}%
                        </span>
                      </li>
                    )
                  })}
              </ul>
            </section>

            <section className="bg-surface-card border border-border rounded-2xl p-5">
              <h2 className="text-sm font-bold text-txt-primary mb-3">
                최근 발행
              </h2>
              <ul className="space-y-2">
                {data.recent.map((r) => {
                  const brand = CHANNEL_BRANDS[r.channel_format as ChannelFormat]
                  const Icon = brand?.icon
                  const body = (
                    <>
                      <div className="flex items-center gap-1.5 mb-1">
                        {Icon && <Icon size={11} className="text-txt-tertiary" />}
                        <span className="text-[11px] font-semibold text-txt-tertiary">
                          {brand?.label ?? r.channel_format}
                        </span>
                        <span className="text-[10px] text-txt-tertiary ml-auto">
                          {formatDate(r.published_at)}
                        </span>
                      </div>
                      <p className="text-xs text-txt-secondary line-clamp-2 leading-relaxed">
                        {r.content_preview}
                      </p>
                    </>
                  )
                  return (
                    <li key={r.id}>
                      {r.bundle_id ? (
                        <Link
                          href={`/clubs/${slug}/bundles/${r.bundle_id}`}
                          className="block p-3 rounded-lg border border-border hover:border-brand-border hover:bg-brand-bg/40 transition-colors"
                        >
                          {body}
                        </Link>
                      ) : (
                        <div className="block p-3 rounded-lg border border-border">
                          {body}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          </div>
        </div>
      )}
    </>
  )
}

// ============================================================
// 컴포넌트들
// ============================================================
function KpiCard({
  label,
  value,
  unit,
  icon,
}: {
  label: string
  value: number | string
  unit: string
  icon: React.ReactNode
}) {
  return (
    <div className="bg-surface-card border border-border rounded-2xl p-4">
      <div className="flex items-center gap-1.5 text-txt-tertiary mb-1">
        {icon}
        <span className="text-[11px] font-semibold">{label}</span>
      </div>
      <p className="text-2xl font-bold text-txt-primary tabular-nums">
        {value}
        <span className="text-xs text-txt-tertiary font-normal ml-1">
          {unit}
        </span>
      </p>
    </div>
  )
}

function DailyBars({
  daily,
  max,
  days,
}: {
  daily: Array<{ date: string; count: number }>
  max: number
  days: number
}) {
  // daily는 데이터 있는 날만 들어있음. 빈 칸 채우기
  const dayMap = new Map(daily.map((d) => [d.date, d.count]))
  const series: Array<{ date: string; count: number }> = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
    const key = kst.toISOString().slice(0, 10)
    series.push({ date: key, count: dayMap.get(key) ?? 0 })
  }

  return (
    <div className="flex items-end gap-[2px] h-32">
      {series.map((d) => (
        <div
          key={d.date}
          className="flex-1 bg-surface-bg rounded-sm relative group cursor-default"
          style={{
            height: d.count > 0 ? `${Math.max(8, (d.count / max) * 100)}%` : '2px',
          }}
        >
          <div
            className={`absolute inset-0 rounded-sm ${d.count > 0 ? 'bg-brand' : ''}`}
          />
          {d.count > 0 && (
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-txt-tertiary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {d.date.slice(5)} · {d.count}건
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function HourHist({ hist, max }: { hist: number[]; max: number }) {
  return (
    <div>
      <div className="flex items-end gap-[2px] h-28 mb-1">
        {hist.map((n, h) => (
          <div
            key={h}
            className="flex-1 rounded-sm bg-surface-bg relative"
            style={{ height: n > 0 ? `${Math.max(8, (n / max) * 100)}%` : '3px' }}
          >
            <div
              className={`absolute inset-0 rounded-sm ${n > 0 ? 'bg-brand/80' : ''}`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[9px] text-txt-tertiary tabular-nums">
        <span>0시</span>
        <span>6시</span>
        <span>12시</span>
        <span>18시</span>
        <span>23시</span>
      </div>
    </div>
  )
}

function WeekdayHist({ hist, max }: { hist: number[]; max: number }) {
  return (
    <ul className="space-y-2">
      {hist.map((n, i) => (
        <li key={i} className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-txt-secondary w-6">
            {WEEKDAY_LABELS[i]}
          </span>
          <div className="flex-1 h-4 bg-surface-bg rounded overflow-hidden">
            <div
              className="h-full bg-brand rounded"
              style={{ width: n > 0 ? `${(n / max) * 100}%` : '0%' }}
            />
          </div>
          <span className="text-[11px] text-txt-tertiary tabular-nums w-8 text-right">
            {n}건
          </span>
        </li>
      ))}
    </ul>
  )
}

function EmptyBlock({ hint }: { hint: string }) {
  return (
    <div className="bg-surface-card border border-dashed border-border rounded-2xl p-10 text-center">
      <div className="w-11 h-11 mx-auto rounded-2xl bg-brand-bg flex items-center justify-center mb-3">
        <TrendingUp size={18} className="text-brand" />
      </div>
      <p className="text-sm font-bold text-txt-primary mb-1">아직 데이터가 없습니다</p>
      <p className="text-xs text-txt-tertiary leading-relaxed max-w-sm mx-auto">
        {hint}
      </p>
    </div>
  )
}

function bestHour(hist: number[]): number | null {
  let max = 0
  let hour = -1
  for (let i = 0; i < hist.length; i++) {
    if (hist[i]! > max) {
      max = hist[i]!
      hour = i
    }
  }
  return hour >= 0 ? hour : null
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const same = d.toDateString() === now.toDateString()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  if (same) return `오늘 ${hh}:${mm}`
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000),
  )
  if (diffDays < 7) return `${diffDays}일 전`
  return `${d.getMonth() + 1}/${d.getDate()}`
}
