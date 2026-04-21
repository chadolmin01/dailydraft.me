'use client'

import { useMemo, useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Calendar, Plus, MapPin, Clock, Trash2, Loader2, X, Users, Mic, Briefcase, AlertTriangle, PartyPopper, Hash } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface ClubEvent {
  id: string
  title: string
  description: string | null
  event_type: string
  location: string | null
  start_at: string
  end_at: string | null
  all_day: boolean
  cohort: string | null
  created_by: string
  created_at: string
}

const EVENT_TYPE_META: Record<string, { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string; bg: string }> = {
  meeting: { label: '회의', icon: Users, color: 'text-status-info-text', bg: 'bg-status-info-bg' },
  presentation: { label: '발표회', icon: Mic, color: 'text-brand', bg: 'bg-brand-bg' },
  recruit: { label: '모집', icon: Briefcase, color: 'text-status-warning-text', bg: 'bg-status-warning-bg' },
  workshop: { label: '워크샵', icon: Hash, color: 'text-purple-700', bg: 'bg-purple-100' },
  social: { label: '친목', icon: PartyPopper, color: 'text-status-success-text', bg: 'bg-status-success-bg' },
  deadline: { label: '마감', icon: AlertTriangle, color: 'text-status-danger-text', bg: 'bg-status-danger-bg' },
  other: { label: '기타', icon: Calendar, color: 'text-txt-secondary', bg: 'bg-surface-sunken' },
}

function formatDateTime(iso: string, allDay: boolean): string {
  const d = new Date(iso)
  if (allDay) {
    return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
  }
  return d.toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function daysUntil(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now()
  return Math.ceil(diff / 86_400_000)
}

export function ClubEventsSection({ slug, isAdmin }: { slug: string; isAdmin: boolean }) {
  const queryClient = useQueryClient()
  const [writing, setWriting] = useState(false)
  const [filter, setFilter] = useState<'upcoming' | 'all' | 'past'>('upcoming')
  const [deleteTarget, setDeleteTarget] = useState<ClubEvent | null>(null)

  const { data, isLoading } = useQuery<{ events: ClubEvent[] }>({
    queryKey: ['club-events', slug],
    queryFn: async () => {
      const res = await fetch(`/api/clubs/${slug}/events`)
      if (!res.ok) throw new Error('Failed')
      const body = await res.json()
      return body.data ?? body
    },
    staleTime: 1000 * 60 * 2,
  })

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['club-events', slug] })
  }, [queryClient, slug])

  const filteredEvents = useMemo(() => {
    const events = data?.events ?? []
    const now = Date.now()
    if (filter === 'upcoming') return events.filter(e => new Date(e.start_at).getTime() >= now)
    if (filter === 'past') return events.filter(e => new Date(e.start_at).getTime() < now).reverse()
    return events
  }, [data, filter])

  const handleDelete = async (e: ClubEvent) => {
    const res = await fetch(`/api/clubs/${slug}/events/${e.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('일정을 삭제했습니다')
      invalidate()
    } else {
      toast.error('삭제에 실패했습니다')
    }
  }

  return (
    <div className="space-y-4">
      {/* 액션 바 */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5">
          {(['upcoming', 'all', 'past'] as const).map(k => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`shrink-0 px-3 py-1.5 text-[12px] font-medium rounded-full border transition-colors ${
                filter === k
                  ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                  : 'text-txt-secondary border-border bg-surface-card hover:border-txt-tertiary'
              }`}
            >
              {k === 'upcoming' ? '다가오는' : k === 'past' ? '지난' : '전체'}
            </button>
          ))}
        </div>
        {isAdmin && !writing && (
          <button
            onClick={() => setWriting(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-semibold bg-surface-inverse text-txt-inverse rounded-full hover:opacity-90 transition-opacity"
          >
            <Plus size={13} />
            일정 등록
          </button>
        )}
      </div>

      {/* 작성 폼 */}
      {writing && isAdmin && (
        <EventForm slug={slug} onClose={() => setWriting(false)} onSuccess={invalidate} />
      )}

      {/* 목록 */}
      {isLoading ? (
        <div className="h-32 bg-surface-sunken rounded-2xl animate-pulse" />
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={filter === 'upcoming' ? '다가오는 일정이 없습니다' : '일정이 없습니다'}
          description={isAdmin ? '새 일정을 등록해보세요' : '운영진이 일정을 등록하면 여기에 표시됩니다'}
        />
      ) : (
        <ul className="space-y-2">
          {filteredEvents.map(e => {
            const meta = EVENT_TYPE_META[e.event_type] ?? EVENT_TYPE_META.other
            const Icon = meta.icon
            const days = daysUntil(e.start_at)
            return (
              <li key={e.id} className="bg-surface-card border border-border rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${meta.bg} ${meta.color} flex items-center justify-center shrink-0`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
                        {meta.label}
                      </span>
                      {e.cohort && (
                        <span className="text-[10px] font-medium text-brand bg-brand-bg px-1.5 py-0.5 rounded-full">
                          {e.cohort}기 한정
                        </span>
                      )}
                      {days >= 0 && days <= 7 && filter !== 'past' && (
                        <span className={`text-[10px] font-bold ${days <= 2 ? 'text-status-danger-text' : 'text-indicator-trending'}`}>
                          D-{days}
                        </span>
                      )}
                    </div>
                    <h3 className="text-[15px] font-bold text-txt-primary mb-1">{e.title}</h3>
                    <div className="flex items-center gap-3 text-[12px] text-txt-tertiary flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={11} />
                        {formatDateTime(e.start_at, e.all_day)}
                      </span>
                      {e.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={11} />
                          {e.location}
                        </span>
                      )}
                    </div>
                    {e.description && (
                      <p className="text-[13px] text-txt-secondary mt-2 leading-relaxed whitespace-pre-line">
                        {e.description}
                      </p>
                    )}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => setDeleteTarget(e)}
                      className="p-1.5 text-txt-disabled hover:text-status-danger-text transition-colors rounded-lg hover:bg-status-danger-bg"
                      aria-label="삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return
          await handleDelete(deleteTarget)
        }}
        title="일정 삭제"
        message={deleteTarget ? `"${deleteTarget.title}" 일정을 삭제합니다.` : ''}
        confirmText="삭제"
        variant="danger"
      />
    </div>
  )
}

function EventForm({ slug, onClose, onSuccess }: {
  slug: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventType, setEventType] = useState<string>('meeting')
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [allDay, setAllDay] = useState(false)
  const [cohort, setCohort] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim() || !startDate) {
      toast.error('제목과 날짜를 입력해주세요')
      return
    }
    const startAt = allDay
      ? new Date(`${startDate}T00:00:00`).toISOString()
      : new Date(`${startDate}T${startTime || '09:00'}:00`).toISOString()

    setSubmitting(true)
    try {
      const res = await fetch(`/api/clubs/${slug}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          event_type: eventType,
          location: location.trim() || undefined,
          start_at: startAt,
          all_day: allDay,
          cohort: cohort.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body?.error?.message ?? '등록 실패')
        return
      }
      toast.success('일정을 등록했습니다')
      onSuccess()
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-surface-card border border-border rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-bold text-txt-primary">새 일정 등록</p>
        <button
          onClick={onClose}
          className="text-txt-disabled hover:text-txt-tertiary"
          aria-label="닫기"
        >
          <X size={14} />
        </button>
      </div>

      <input
        value={title}
        onChange={e => setTitle(e.target.value.slice(0, 200))}
        placeholder="일정 제목"
        autoFocus
        className="w-full px-3 py-2.5 text-[14px] font-semibold bg-surface-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40"
      />

      {/* 유형 */}
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(EVENT_TYPE_META) as Array<keyof typeof EVENT_TYPE_META>).map(k => {
          const meta = EVENT_TYPE_META[k]
          const active = eventType === k
          return (
            <button
              key={k}
              type="button"
              onClick={() => setEventType(k)}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                active
                  ? 'bg-brand-bg text-brand border-brand-border'
                  : 'text-txt-tertiary border-border hover:border-txt-tertiary'
              }`}
            >
              {meta.label}
            </button>
          )
        })}
      </div>

      {/* 날짜·시간 */}
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className="px-3 py-2 text-[13px] bg-surface-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
        <input
          type="time"
          value={startTime}
          onChange={e => setStartTime(e.target.value)}
          disabled={allDay}
          className="px-3 py-2 text-[13px] bg-surface-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-50"
        />
      </div>
      <label className="flex items-center gap-2 text-[12px] text-txt-secondary cursor-pointer">
        <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} className="rounded" />
        종일 이벤트
      </label>

      <input
        value={location}
        onChange={e => setLocation(e.target.value.slice(0, 200))}
        placeholder="장소 (예: 공학관 301호 / Discord #일반)"
        className="w-full px-3 py-2 text-[13px] bg-surface-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40"
      />

      <input
        value={cohort}
        onChange={e => setCohort(e.target.value.slice(0, 20))}
        placeholder="특정 기수 한정 (선택, 예: 3)"
        className="w-full px-3 py-2 text-[13px] bg-surface-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40"
      />

      <textarea
        value={description}
        onChange={e => setDescription(e.target.value.slice(0, 2000))}
        placeholder="설명 (선택)"
        rows={3}
        className="w-full px-3 py-2 text-[13px] bg-surface-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
      />

      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-[13px] font-medium text-txt-secondary hover:text-txt-primary transition-colors"
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || !title.trim() || !startDate}
          className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-semibold bg-brand text-white rounded-full hover:bg-brand-hover disabled:opacity-50 transition-colors"
        >
          {submitting ? <Loader2 size={13} className="animate-spin" /> : null}
          등록
        </button>
      </div>
    </div>
  )
}
