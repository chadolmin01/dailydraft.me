'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CalendarCheck,
  List,
  CalendarRange,
  Plus,
  ArrowRight,
  Circle,
  CheckCircle2,
  XCircle,
  FileText,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'
import { useClub } from '@/src/hooks/useClub'
import { usePersonaByOwner } from '@/src/hooks/usePersona'
import {
  useCalendarOutputs,
  type CalendarOutputRow,
  type CalendarStatus,
} from '@/src/hooks/useCalendarOutputs'
import { useScheduleOutput } from '@/src/hooks/useBundles'
import { EVENT_CONFIG } from '@/src/lib/personas/event-catalog'
import type { ChannelFormat, EventType } from '@/src/lib/personas/types'
import { CHANNEL_BRANDS } from './channel-brand'

interface Props {
  slug: string
}

type ViewMode = 'calendar' | 'list'
type CalendarScale = 'month' | 'week'

const STATUS_META: Record<
  CalendarStatus,
  { label: string; dot: string; pill: string }
> = {
  published: {
    label: '발행됨',
    dot: 'bg-green-500',
    pill: 'bg-green-500/10 text-green-700',
  },
  scheduled: {
    label: '예약됨',
    dot: 'bg-brand',
    pill: 'bg-brand-bg text-brand',
  },
  draft: {
    label: '임시저장',
    dot: 'bg-amber-500',
    pill: 'bg-amber-500/10 text-amber-700',
  },
  rejected: {
    label: '거절됨',
    dot: 'bg-status-danger-text',
    pill: 'bg-status-danger-text/10 text-status-danger-text',
  },
}

/**
 * 콘텐츠 캘린더 (mirra 020540 패턴).
 *
 * 구조:
 *   - 헤더: 제목 + "새 예약" CTA + 자동화 설정 링크
 *   - 뷰 토글: 캘린더 / 리스트
 *   - 메인(2/3): 캘린더 그리드(월/주간) 또는 리스트
 *   - 사이드바(1/3): 상태 필터 체크박스 + 관련 게시물 리스트
 */
export function AutomationsShell({ slug }: Props) {
  const { data: club } = useClub(slug)
  const { data: personaData } = usePersonaByOwner('club', club?.id)
  const persona = personaData?.persona
  const isAdmin = club?.my_role === 'owner' || club?.my_role === 'admin'

  const [view, setView] = useState<ViewMode>('calendar')
  const [scale, setScale] = useState<CalendarScale>('month')
  const [cursor, setCursor] = useState<Date>(() => startOfMonth(new Date()))
  const [enabledFilters, setEnabledFilters] = useState<Set<CalendarStatus>>(
    () => new Set(['published', 'scheduled', 'draft', 'rejected']),
  )

  const range = useMemo(() => computeRange(cursor, scale), [cursor, scale])

  const { data, isLoading } = useCalendarOutputs(persona?.id, range)
  const cancelSchedule = useScheduleOutput(undefined)

  const outputs = data?.outputs ?? []
  const filteredOutputs = useMemo(
    () => outputs.filter((o) => enabledFilters.has(o.cal_status)),
    [outputs, enabledFilters],
  )

  // 사이드바 리스트: 현재 기간의 예약된 것만 시간순
  const upcoming = useMemo(() => {
    const now = Date.now()
    return filteredOutputs
      .filter(
        (o) =>
          o.cal_status === 'scheduled' &&
          new Date(o.cal_date).getTime() >= now - 60_000,
      )
      .slice(0, 10)
  }, [filteredOutputs])

  const toggleFilter = (s: CalendarStatus) => {
    setEnabledFilters((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  }

  const allOn =
    (['published', 'scheduled', 'draft', 'rejected'] as CalendarStatus[]).every(
      (s) => enabledFilters.has(s),
    )

  const toggleAll = () => {
    if (allOn) setEnabledFilters(new Set())
    else
      setEnabledFilters(
        new Set(['published', 'scheduled', 'draft', 'rejected']),
      )
  }

  const onPrev = () => setCursor((c) => shiftCursor(c, scale, -1))
  const onNext = () => setCursor((c) => shiftCursor(c, scale, 1))
  const onToday = () => setCursor(scale === 'month' ? startOfMonth(new Date()) : startOfWeek(new Date()))

  const onScale = (s: CalendarScale) => {
    setScale(s)
    setCursor(s === 'month' ? startOfMonth(cursor) : startOfWeek(cursor))
  }

  return (
    <>
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/clubs/${slug}`}
            className="text-txt-tertiary hover:text-txt-primary transition-colors shrink-0"
            aria-label="뒤로"
          >
            <ChevronLeft size={20} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-txt-primary">콘텐츠 캘린더</h1>
            <p className="text-xs text-txt-tertiary leading-relaxed">
              {club?.name ?? '우리 동아리'}의 예약·발행 내역을 한눈에 관리합니다.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && persona && (
            <>
              <Link
                href={`/clubs/${slug}/automations/settings`}
                className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl border border-border text-sm font-semibold text-txt-secondary hover:bg-surface-bg transition-colors"
                title="자동화 설정"
              >
                <Settings size={14} />
                자동화 설정
              </Link>
              <Link
                href={`/clubs/${slug}/bundles/new?schedule=1`}
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors"
              >
                <Plus size={14} />새 콘텐츠 예약
              </Link>
            </>
          )}
        </div>
      </div>

      {/* 뷰 토글 가운데 */}
      <div className="flex items-center justify-center mb-4">
        <div className="inline-flex items-center gap-1 bg-surface-card border border-border rounded-full p-1">
          <button
            onClick={() => setView('calendar')}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              view === 'calendar'
                ? 'bg-txt-primary text-surface-card'
                : 'text-txt-secondary hover:text-txt-primary'
            }`}
          >
            <CalendarRange size={13} />
            캘린더
          </button>
          <button
            onClick={() => setView('list')}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              view === 'list'
                ? 'bg-txt-primary text-surface-card'
                : 'text-txt-secondary hover:text-txt-primary'
            }`}
          >
            <List size={13} />
            리스트
          </button>
        </div>
      </div>

      {/* 메인 + 사이드바 */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          {/* 날짜 네비 */}
          {view === 'calendar' && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onScale('week')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    scale === 'week'
                      ? 'bg-txt-primary text-surface-card'
                      : 'text-txt-secondary border border-border hover:bg-surface-bg'
                  }`}
                >
                  주간
                </button>
                <button
                  onClick={() => onScale('month')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    scale === 'month'
                      ? 'bg-txt-primary text-surface-card'
                      : 'text-txt-secondary border border-border hover:bg-surface-bg'
                  }`}
                >
                  월간
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onPrev}
                  className="w-8 h-8 rounded-lg border border-border text-txt-secondary hover:bg-surface-bg transition-colors inline-flex items-center justify-center"
                  aria-label="이전"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-sm font-bold text-txt-primary min-w-[140px] text-center">
                  {formatCursorLabel(cursor, scale)}
                </span>
                <button
                  onClick={onNext}
                  className="w-8 h-8 rounded-lg border border-border text-txt-secondary hover:bg-surface-bg transition-colors inline-flex items-center justify-center"
                  aria-label="다음"
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  onClick={onToday}
                  className="h-8 px-3 rounded-lg text-xs font-semibold border border-border text-txt-secondary hover:bg-surface-bg transition-colors"
                >
                  오늘
                </button>
              </div>
            </div>
          )}

          {/* 콘텐츠 */}
          {!persona ? (
            <EmptyBlock
              title="페르소나가 먼저 필요합니다"
              hint="콘텐츠 캘린더를 쓰시려면 동아리 브랜드 페르소나가 있어야 합니다."
              cta={{
                label: '페르소나 설정하러 가기',
                href: `/clubs/${slug}/settings/persona`,
              }}
            />
          ) : isLoading ? (
            <div className="h-[560px] bg-surface-card rounded-2xl skeleton-shimmer" />
          ) : view === 'calendar' && scale === 'month' ? (
            <MonthGrid
              cursor={cursor}
              outputs={filteredOutputs}
              slug={slug}
            />
          ) : view === 'calendar' && scale === 'week' ? (
            <WeekGrid
              cursor={cursor}
              outputs={filteredOutputs}
              slug={slug}
            />
          ) : (
            <ListView
              outputs={filteredOutputs}
              slug={slug}
              onCancel={(outputId) =>
                cancelSchedule.mutate(
                  { output_id: outputId, scheduled_at: null },
                  {
                    onSuccess: () => toast.success('예약이 취소되었습니다'),
                  },
                )
              }
            />
          )}
        </div>

        {/* 사이드바 */}
        <aside className="space-y-4">
          {isAdmin && persona && (
            <Link
              href={`/clubs/${slug}/bundles/new?schedule=1`}
              className="flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors"
            >
              <Plus size={14} />새 콘텐츠 예약
            </Link>
          )}

          <section className="bg-surface-card border border-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-txt-primary">상태 필터</h3>
              <button
                onClick={toggleAll}
                className="text-[10px] font-semibold text-txt-tertiary hover:text-txt-primary transition-colors"
              >
                {allOn ? '모두 해제' : '모두 선택'}
              </button>
            </div>
            <ul className="space-y-1.5">
              {(['published', 'scheduled', 'draft', 'rejected'] as CalendarStatus[]).map(
                (s) => {
                  const meta = STATUS_META[s]
                  const count = outputs.filter((o) => o.cal_status === s).length
                  const on = enabledFilters.has(s)
                  return (
                    <li key={s}>
                      <button
                        onClick={() => toggleFilter(s)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-bg transition-colors"
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                            on
                              ? 'bg-txt-primary border-txt-primary'
                              : 'border-border'
                          }`}
                        >
                          {on && <CheckCircle2 size={9} className="text-surface-card" />}
                        </span>
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${meta.dot} shrink-0`}
                        />
                        <span className="text-xs text-txt-primary flex-1 text-left">
                          {meta.label}
                        </span>
                        <span className="text-[10px] text-txt-tertiary">{count}</span>
                      </button>
                    </li>
                  )
                },
              )}
            </ul>
          </section>

          <section className="bg-surface-card border border-border rounded-2xl p-4">
            <h3 className="text-xs font-bold text-txt-primary mb-3">
              예정된 게시물 {upcoming.length > 0 && `(${upcoming.length})`}
            </h3>
            {upcoming.length === 0 ? (
              <p className="text-[11px] text-txt-tertiary leading-relaxed">
                예약된 게시물이 없습니다. 새 콘텐츠 예약으로 시작하십시오.
              </p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((o) => (
                  <UpcomingItem key={o.id} output={o} slug={slug} />
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </>
  )
}

// ============================================================
// Month grid
// ============================================================
function MonthGrid({
  cursor,
  outputs,
  slug,
}: {
  cursor: Date
  outputs: CalendarOutputRow[]
  slug: string
}) {
  const cells = useMemo(() => buildMonthCells(cursor), [cursor])
  const byDate = useMemo(() => groupByDateKey(outputs), [outputs])
  const monthNum = cursor.getMonth()

  return (
    <div className="bg-surface-card border border-border rounded-2xl overflow-hidden">
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-border bg-surface-bg">
        {['월', '화', '수', '목', '금', '토', '일'].map((w) => (
          <div
            key={w}
            className="text-[11px] font-semibold text-txt-tertiary text-center py-2"
          >
            {w}
          </div>
        ))}
      </div>
      {/* 날짜 셀 */}
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          const isOtherMonth = d.getMonth() !== monthNum
          const isToday = isSameDay(d, new Date())
          const key = dateKey(d)
          const dayOutputs = byDate.get(key) ?? []
          return (
            <div
              key={i}
              className={`min-h-[110px] border-r border-b border-border p-1.5 last:border-r-0 ${
                isOtherMonth ? 'bg-surface-bg/50' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[11px] font-semibold inline-flex items-center justify-center ${
                    isToday
                      ? 'w-5 h-5 rounded-full bg-brand text-white'
                      : isOtherMonth
                        ? 'text-txt-tertiary'
                        : 'text-txt-primary'
                  }`}
                >
                  {d.getDate()}
                </span>
              </div>
              <div className="space-y-1">
                {dayOutputs.slice(0, 3).map((o) => (
                  <DayChip key={o.id} output={o} slug={slug} />
                ))}
                {dayOutputs.length > 3 && (
                  <span className="text-[10px] text-txt-tertiary px-1">
                    +{dayOutputs.length - 3}개
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DayChip({
  output,
  slug,
}: {
  output: CalendarOutputRow
  slug: string
}) {
  const meta = STATUS_META[output.cal_status]
  const eventLabel = output.bundle
    ? EVENT_CONFIG[output.bundle.event_type as EventType]?.label ?? output.bundle.event_type
    : '덱'
  const title =
    (output.bundle?.event_metadata?.title as string | undefined) || eventLabel
  const hh = String(new Date(output.cal_date).getHours()).padStart(2, '0')
  const mm = String(new Date(output.cal_date).getMinutes()).padStart(2, '0')
  const content = output.bundle_id ? (
    <Link
      href={`/clubs/${slug}/bundles/${output.bundle_id}`}
      className={`block w-full text-left text-[10px] px-1.5 py-1 rounded ${meta.pill} truncate hover:opacity-80 transition-opacity`}
    >
      <span className="inline-flex items-center gap-1">
        <span className="opacity-70">{hh}:{mm}</span>
        <span className="truncate">{title}</span>
      </span>
    </Link>
  ) : (
    <span
      className={`block text-[10px] px-1.5 py-1 rounded ${meta.pill} truncate`}
    >
      <span className="opacity-70">{hh}:{mm}</span> {title}
    </span>
  )
  return content
}

// ============================================================
// Week grid
// ============================================================
function WeekGrid({
  cursor,
  outputs,
  slug,
}: {
  cursor: Date
  outputs: CalendarOutputRow[]
  slug: string
}) {
  const days = useMemo(() => buildWeekDays(cursor), [cursor])
  const byDate = useMemo(() => groupByDateKey(outputs), [outputs])

  return (
    <div className="bg-surface-card border border-border rounded-2xl overflow-hidden">
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const key = dateKey(d)
          const dayOutputs = (byDate.get(key) ?? []).sort(
            (a, b) =>
              new Date(a.cal_date).getTime() - new Date(b.cal_date).getTime(),
          )
          const isToday = isSameDay(d, new Date())
          return (
            <div
              key={i}
              className="min-h-[480px] border-r border-border p-2 last:border-r-0"
            >
              <div className="text-center mb-2 pb-2 border-b border-border">
                <p className="text-[10px] font-semibold text-txt-tertiary">
                  {['월', '화', '수', '목', '금', '토', '일'][i]}
                </p>
                <p
                  className={`text-sm font-bold inline-flex items-center justify-center mt-0.5 ${
                    isToday
                      ? 'w-6 h-6 rounded-full bg-brand text-white'
                      : 'text-txt-primary'
                  }`}
                >
                  {d.getDate()}
                </p>
              </div>
              <div className="space-y-1.5">
                {dayOutputs.map((o) => (
                  <WeekChip key={o.id} output={o} slug={slug} />
                ))}
                {dayOutputs.length === 0 && (
                  <p className="text-[10px] text-txt-tertiary text-center py-4">
                    —
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeekChip({
  output,
  slug,
}: {
  output: CalendarOutputRow
  slug: string
}) {
  const meta = STATUS_META[output.cal_status]
  const fmt = output.channel_format as ChannelFormat
  const brand = CHANNEL_BRANDS[fmt]
  const Icon = brand?.icon
  const eventLabel = output.bundle
    ? EVENT_CONFIG[output.bundle.event_type as EventType]?.label ?? output.bundle.event_type
    : '덱'
  const title =
    (output.bundle?.event_metadata?.title as string | undefined) || eventLabel
  const hh = String(new Date(output.cal_date).getHours()).padStart(2, '0')
  const mm = String(new Date(output.cal_date).getMinutes()).padStart(2, '0')

  const body = (
    <>
      <div className="flex items-center gap-1 mb-0.5">
        <span className={`w-1 h-1 rounded-full ${meta.dot}`} />
        <span className="text-[10px] font-semibold opacity-80">
          {hh}:{mm}
        </span>
      </div>
      <p className="text-[11px] font-semibold line-clamp-2">{title}</p>
      <div className="flex items-center gap-1 mt-1">
        {Icon && <Icon size={9} />}
        <span className="text-[10px] opacity-80">{brand?.label ?? fmt}</span>
      </div>
    </>
  )

  const className = `block w-full text-left px-1.5 py-1 rounded ${meta.pill}`

  return output.bundle_id ? (
    <Link
      href={`/clubs/${slug}/bundles/${output.bundle_id}`}
      className={`${className} hover:opacity-80 transition-opacity`}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}

// ============================================================
// List view (legacy)
// ============================================================
function ListView({
  outputs,
  slug,
  onCancel,
}: {
  outputs: CalendarOutputRow[]
  slug: string
  onCancel: (outputId: string) => void
}) {
  const grouped = useMemo(() => groupByBundle(outputs), [outputs])
  if (grouped.length === 0) {
    return (
      <EmptyBlock
        title="이 기간에 표시할 덱이 없습니다"
        hint="필터를 바꾸시거나 다른 월로 이동해 주십시오."
      />
    )
  }
  return (
    <div className="space-y-3">
      {grouped.map((g) => (
        <GroupCard
          key={g.bundle_id ?? g.outputs[0]!.id + g.cal_date}
          group={g}
          slug={slug}
          onCancel={onCancel}
        />
      ))}
    </div>
  )
}

interface GroupedSchedule {
  bundle_id: string | null
  cal_date: string
  event_type: string | null
  event_metadata: Record<string, unknown> | null
  outputs: CalendarOutputRow[]
}

function GroupCard({
  group,
  slug,
  onCancel,
}: {
  group: GroupedSchedule
  slug: string
  onCancel: (outputId: string) => void
}) {
  const config = group.event_type
    ? EVENT_CONFIG[group.event_type as EventType]
    : null
  const eventLabel = config?.label ?? group.event_type ?? '덱'
  const title =
    (group.event_metadata?.title as string | undefined) || eventLabel
  const relative = formatRelative(group.cal_date)
  const isFuture = new Date(group.cal_date).getTime() > Date.now()

  return (
    <article className="bg-surface-card border border-border rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[11px] font-semibold text-brand">
              {eventLabel}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-txt-primary">
              <Clock size={11} />
              {relative}
            </span>
          </div>
          <h3 className="text-sm font-bold text-txt-primary line-clamp-1">
            {title}
          </h3>
        </div>
        {group.bundle_id && (
          <Link
            href={`/clubs/${slug}/bundles/${group.bundle_id}`}
            className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"
          >
            덱 열기
            <ArrowRight size={11} />
          </Link>
        )}
      </div>

      <ul className="space-y-2">
        {group.outputs.map((o) => {
          const fmt = o.channel_format as ChannelFormat
          const brand = CHANNEL_BRANDS[fmt]
          const Icon = brand?.icon
          const meta = STATUS_META[o.cal_status]
          return (
            <li
              key={o.id}
              className="flex items-center justify-between gap-2 px-3 py-2 bg-surface-bg rounded-lg"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded ${brand?.bg ?? 'bg-surface-bg'} ${brand?.text ?? 'text-txt-tertiary'}`}
                >
                  {Icon && <Icon size={11} />}
                  {brand?.label ?? fmt}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${meta.pill}`}
                >
                  {meta.label}
                </span>
              </div>
              {o.cal_status === 'scheduled' && isFuture && (
                <button
                  onClick={() => onCancel(o.id)}
                  className="text-[11px] font-semibold text-txt-tertiary hover:text-status-danger-text transition-colors"
                >
                  예약 취소
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </article>
  )
}

function groupByBundle(outputs: CalendarOutputRow[]): GroupedSchedule[] {
  const map = new Map<string, GroupedSchedule>()
  for (const o of outputs) {
    const key = `${o.bundle_id ?? 'single'}::${o.cal_date}`
    const existing = map.get(key)
    if (existing) existing.outputs.push(o)
    else
      map.set(key, {
        bundle_id: o.bundle_id,
        cal_date: o.cal_date,
        event_type: o.bundle?.event_type ?? null,
        event_metadata: o.bundle?.event_metadata ?? null,
        outputs: [o],
      })
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.cal_date).getTime() - new Date(b.cal_date).getTime(),
  )
}

// ============================================================
// Upcoming item for sidebar
// ============================================================
function UpcomingItem({
  output,
  slug,
}: {
  output: CalendarOutputRow
  slug: string
}) {
  const meta = STATUS_META[output.cal_status]
  const fmt = output.channel_format as ChannelFormat
  const brand = CHANNEL_BRANDS[fmt]
  const Icon = brand?.icon
  const eventLabel = output.bundle
    ? EVENT_CONFIG[output.bundle.event_type as EventType]?.label ?? output.bundle.event_type
    : '덱'
  const title =
    (output.bundle?.event_metadata?.title as string | undefined) || eventLabel
  const when = formatRelative(output.cal_date)

  const body = (
    <div className="flex items-start gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-0.5">
          {Icon && <Icon size={10} className="text-txt-tertiary" />}
          <span className="text-[10px] font-semibold text-txt-tertiary">
            {brand?.label ?? fmt}
          </span>
        </div>
        <p className="text-xs font-semibold text-txt-primary line-clamp-1">
          {title}
        </p>
        <p className="text-[11px] text-txt-tertiary mt-0.5">{when}</p>
      </div>
      <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${meta.pill}`}>
        {meta.label}
      </span>
    </div>
  )
  return (
    <li>
      {output.bundle_id ? (
        <Link
          href={`/clubs/${slug}/bundles/${output.bundle_id}`}
          className="block p-2 rounded-lg hover:bg-surface-bg transition-colors"
        >
          {body}
        </Link>
      ) : (
        <div className="p-2 rounded-lg">{body}</div>
      )}
    </li>
  )
}

// ============================================================
// Empty
// ============================================================
function EmptyBlock({
  title,
  hint,
  cta,
}: {
  title: string
  hint: string
  cta?: { label: string; href: string }
}) {
  return (
    <div className="bg-surface-card border border-dashed border-border rounded-2xl p-10 text-center">
      <div className="w-11 h-11 mx-auto rounded-2xl bg-brand-bg flex items-center justify-center mb-3">
        <CalendarCheck size={18} className="text-brand" />
      </div>
      <p className="text-sm font-bold text-txt-primary mb-1">{title}</p>
      <p className="text-xs text-txt-tertiary leading-relaxed mb-5 max-w-sm mx-auto">
        {hint}
      </p>
      {cta && (
        <Link
          href={cta.href}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors"
        >
          {cta.label}
        </Link>
      )}
    </div>
  )
}

// ============================================================
// Date helpers — 월요일 시작 주
// ============================================================
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function startOfWeek(d: Date): Date {
  const wd = (d.getDay() + 6) % 7 // 월=0
  const base = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  base.setDate(base.getDate() - wd)
  return base
}
function shiftCursor(d: Date, scale: CalendarScale, dir: -1 | 1): Date {
  if (scale === 'month') {
    return new Date(d.getFullYear(), d.getMonth() + dir, 1)
  }
  const n = new Date(d)
  n.setDate(n.getDate() + 7 * dir)
  return n
}
function computeRange(
  cursor: Date,
  scale: CalendarScale,
): { start: string; end: string } {
  if (scale === 'month') {
    const first = startOfMonth(cursor)
    const gridStart = startOfWeek(first)
    const end = new Date(gridStart)
    end.setDate(end.getDate() + 42) // 6주
    return { start: gridStart.toISOString(), end: end.toISOString() }
  }
  const start = startOfWeek(cursor)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return { start: start.toISOString(), end: end.toISOString() }
}
function buildMonthCells(cursor: Date): Date[] {
  const first = startOfMonth(cursor)
  const gridStart = startOfWeek(first)
  const cells: Date[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setDate(d.getDate() + i)
    cells.push(d)
  }
  return cells
}
function buildWeekDays(cursor: Date): Date[] {
  const start = startOfWeek(cursor)
  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    days.push(d)
  }
  return days
}
function dateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function groupByDateKey(
  outputs: CalendarOutputRow[],
): Map<string, CalendarOutputRow[]> {
  const map = new Map<string, CalendarOutputRow[]>()
  for (const o of outputs) {
    const k = dateKey(new Date(o.cal_date))
    const arr = map.get(k) ?? []
    arr.push(o)
    map.set(k, arr)
  }
  return map
}
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}
function formatCursorLabel(d: Date, scale: CalendarScale): string {
  if (scale === 'month') {
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월`
  }
  const end = new Date(d)
  end.setDate(end.getDate() + 6)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ~ ${end.getMonth() + 1}월 ${end.getDate()}일`
}
function formatRelative(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const same = isSameDay(d, now)
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  const isTomorrow = isSameDay(d, tomorrow)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  if (same) return `오늘 ${hh}:${mm}`
  if (isTomorrow) return `내일 ${hh}:${mm}`
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${hh}:${mm}`
}
