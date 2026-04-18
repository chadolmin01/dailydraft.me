'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
  Plus,
} from 'lucide-react'
import { useClub } from '@/src/hooks/useClub'
import { usePersonaByOwner } from '@/src/hooks/usePersona'
import {
  useCalendarOutputs,
  type CalendarOutputRow,
  type CalendarStatus,
} from '@/src/hooks/useCalendarOutputs'
import { EVENT_CONFIG } from '@/src/lib/personas/event-catalog'
import type { EventType } from '@/src/lib/personas/types'

interface Props {
  slug: string
  embedded?: boolean
}

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

const ALL_STATUSES: CalendarStatus[] = [
  'published',
  'scheduled',
  'draft',
  'rejected',
]

/**
 * 콘텐츠 캘린더 (Draft 재해석).
 *
 * mirra 대비 변경:
 *   - 사이드바 필터 박스/예정 리스트 제거 — 셀 자체가 예정을 이미 보여줌
 *   - 필터는 인라인 칩 (Draft DeckListShell 패턴과 일관)
 *   - 캘린더만. 리스트 뷰는 /contents?tab=decks로 분리됨
 *   - embedded 모드에선 헤더·액션 허브가 렌더(여기선 그리드만)
 */
export function AutomationsShell({ slug, embedded = false }: Props) {
  const { data: club } = useClub(slug)
  const { data: personaData } = usePersonaByOwner('club', club?.id)
  const persona = personaData?.persona
  const isAdmin = club?.my_role === 'owner' || club?.my_role === 'admin'

  const [scale, setScale] = useState<CalendarScale>('month')
  const [cursor, setCursor] = useState<Date>(() => startOfMonth(new Date()))
  const [enabledFilters, setEnabledFilters] = useState<Set<CalendarStatus>>(
    () => new Set(ALL_STATUSES),
  )

  const range = useMemo(() => computeRange(cursor, scale), [cursor, scale])
  const { data, isLoading } = useCalendarOutputs(persona?.id, range)

  const outputs = data?.outputs ?? []
  const filteredOutputs = useMemo(
    () => outputs.filter((o) => enabledFilters.has(o.cal_status)),
    [outputs, enabledFilters],
  )

  const toggleFilter = (s: CalendarStatus) => {
    setEnabledFilters((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  }

  const onPrev = () => setCursor((c) => shiftCursor(c, scale, -1))
  const onNext = () => setCursor((c) => shiftCursor(c, scale, 1))
  const onToday = () =>
    setCursor(scale === 'month' ? startOfMonth(new Date()) : startOfWeek(new Date()))

  const onScale = (s: CalendarScale) => {
    setScale(s)
    setCursor(s === 'month' ? startOfMonth(cursor) : startOfWeek(cursor))
  }

  return (
    <>
      {/* standalone 모드에서만 헤더 렌더. embedded는 허브가 처리. */}
      {!embedded && (
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
          {isAdmin && persona && (
            <Link
              href={`/clubs/${slug}/bundles/new?schedule=1`}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors shrink-0"
            >
              <Plus size={14} />새 콘텐츠 예약
            </Link>
          )}
        </div>
      )}

      {/* 컨트롤 줄 — 주/월 토글 + 날짜 네비 + 필터 칩 */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="inline-flex items-center gap-0.5 bg-surface-card border border-border rounded-lg p-0.5">
          <button
            onClick={() => onScale('week')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              scale === 'week'
                ? 'bg-txt-primary text-surface-card'
                : 'text-txt-secondary hover:text-txt-primary'
            }`}
          >
            주간
          </button>
          <button
            onClick={() => onScale('month')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              scale === 'month'
                ? 'bg-txt-primary text-surface-card'
                : 'text-txt-secondary hover:text-txt-primary'
            }`}
          >
            월간
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onPrev}
            className="w-8 h-8 rounded-lg border border-border text-txt-secondary hover:bg-surface-bg transition-colors inline-flex items-center justify-center"
            aria-label="이전"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-sm font-bold text-txt-primary min-w-[120px] text-center tabular-nums">
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

        {/* 필터 칩 — 인라인, 토글형 */}
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          {ALL_STATUSES.map((s) => {
            const meta = STATUS_META[s]
            const count = outputs.filter((o) => o.cal_status === s).length
            const on = enabledFilters.has(s)
            return (
              <button
                key={s}
                onClick={() => toggleFilter(s)}
                className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  on
                    ? 'bg-surface-card border border-border text-txt-primary'
                    : 'bg-transparent border border-transparent text-txt-tertiary hover:bg-surface-bg'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                {meta.label}
                {count > 0 && (
                  <span className="text-[10px] text-txt-tertiary tabular-nums">
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 본문 */}
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
      ) : scale === 'month' ? (
        <MonthGrid cursor={cursor} outputs={filteredOutputs} slug={slug} />
      ) : (
        <WeekGrid cursor={cursor} outputs={filteredOutputs} slug={slug} />
      )}
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
    ? EVENT_CONFIG[output.bundle.event_type as EventType]?.label ??
      output.bundle.event_type
    : '덱'
  const title =
    (output.bundle?.event_metadata?.title as string | undefined) || eventLabel
  const hh = String(new Date(output.cal_date).getHours()).padStart(2, '0')
  const mm = String(new Date(output.cal_date).getMinutes()).padStart(2, '0')

  return output.bundle_id ? (
    <Link
      href={`/clubs/${slug}/bundles/${output.bundle_id}`}
      className={`block w-full text-left text-[10px] px-1.5 py-1 rounded ${meta.pill} truncate hover:opacity-80 transition-opacity`}
    >
      <span className="opacity-70 tabular-nums">
        {hh}:{mm}
      </span>{' '}
      <span className="truncate">{title}</span>
    </Link>
  ) : (
    <span
      className={`block text-[10px] px-1.5 py-1 rounded ${meta.pill} truncate`}
    >
      <span className="opacity-70 tabular-nums">
        {hh}:{mm}
      </span>{' '}
      {title}
    </span>
  )
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
  const eventLabel = output.bundle
    ? EVENT_CONFIG[output.bundle.event_type as EventType]?.label ??
      output.bundle.event_type
    : '덱'
  const title =
    (output.bundle?.event_metadata?.title as string | undefined) || eventLabel
  const hh = String(new Date(output.cal_date).getHours()).padStart(2, '0')
  const mm = String(new Date(output.cal_date).getMinutes()).padStart(2, '0')

  const body = (
    <>
      <div className="flex items-center gap-1 mb-0.5">
        <span className={`w-1 h-1 rounded-full ${meta.dot}`} />
        <span className="text-[10px] font-semibold opacity-80 tabular-nums">
          {hh}:{mm}
        </span>
      </div>
      <p className="text-[11px] font-semibold line-clamp-2 leading-snug">
        {title}
      </p>
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
  const wd = (d.getDay() + 6) % 7
  const base = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  base.setDate(base.getDate() - wd)
  return base
}
function shiftCursor(d: Date, scale: CalendarScale, dir: -1 | 1): Date {
  if (scale === 'month')
    return new Date(d.getFullYear(), d.getMonth() + dir, 1)
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
    end.setDate(end.getDate() + 42)
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
  if (scale === 'month') return `${d.getFullYear()}년 ${d.getMonth() + 1}월`
  const end = new Date(d)
  end.setDate(end.getDate() + 6)
  return `${d.getMonth() + 1}.${d.getDate()} ~ ${end.getMonth() + 1}.${end.getDate()}`
}
