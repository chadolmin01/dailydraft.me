'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Megaphone, Plus, Pin, PinOff, Trash2, Loader2, Send, X, Sparkles, Clock, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { timeAgo } from '@/src/lib/utils'

interface Announcement {
  id: string
  title: string
  content: string
  is_pinned: boolean
  author_id: string
  created_at: string
  scheduled_at?: string | null
  published_at?: string | null
  author: { nickname: string; avatar_url: string | null } | null
}

interface Props {
  slug: string
  isAdmin: boolean
}

const TEMPLATES: Array<{ key: string; label: string; title: string; body: string }> = [
  {
    key: 'welcome',
    label: '신규 기수 환영',
    title: '○기 여러분 환영합니다 🎉',
    body: `안녕하세요 ○기 여러분, 동아리에 합류하신 것을 환영합니다.

[첫 주 해야 할 것]
- 프로필 완성: Draft에 본인 정보 업데이트
- Discord 채널 확인
- 첫 오리엔테이션: (일정 안내)

문의는 운영진에게 편하게 연락주세요.`,
  },
  {
    key: 'recruit',
    label: '모집 공고',
    title: '○기 신규 멤버 모집합니다',
    body: `[모집 기간]
- 202X년 O월 O일까지

[지원 자격]
- (예: 학부·대학원 재학생)

[지원 방법]
- Draft 초대 코드로 가입

[문의]
- 운영진 Discord DM`,
  },
  {
    key: 'meeting_change',
    label: '회의 변경',
    title: '○월 ○일 회의 일정 변경 안내',
    body: `기존 ○월 ○일 ○시 회의가 변경되었습니다.

[변경 후]
- 일시: ○월 ○일 ○시
- 장소: (오프라인 장소 또는 온라인 링크)

변경에 참고 부탁드립니다. 참석 어려우시면 미리 알려주세요.`,
  },
  {
    key: 'demo_day',
    label: '데모데이',
    title: '○기 데모데이 일정 안내',
    body: `[일시]
- 202X년 O월 O일 오후 ○시

[장소]
- (공학관 301호 / 온라인)

[일정]
- 14:00 오프닝
- 14:10 팀별 발표 (팀당 10분)
- 15:30 Q&A·네트워킹

[준비물]
- 팀별 발표 자료 사전 제출 필요`,
  },
  {
    key: 'graduation',
    label: '졸업 축하',
    title: '○기 졸업을 축하합니다 🎓',
    body: `○기 멤버들이 공식 졸업 처리되었습니다.

여러분의 기록은 Draft에 영구 보관되어, 다음 기수 후배들이 참고하고 멘토로 연결될 수 있습니다.

[앞으로]
- 알럼나이 자격으로 Draft 계속 이용 가능
- 후배들의 멘토 요청 시 DM 받게 됩니다

그동안 활동에 감사드립니다.`,
  },
]

export function ClubAnnouncementsSection({ slug, isAdmin }: Props) {
  const queryClient = useQueryClient()
  const [writing, setWriting] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [pinNew, setPinNew] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const seenRef = useRef<Set<string>>(new Set())

  const { data, isLoading } = useQuery<{ announcements: Announcement[]; total: number }>({
    queryKey: ['club-announcements', slug],
    queryFn: async () => {
      const res = await fetch(`/api/clubs/${slug}/announcements?limit=30`)
      if (!res.ok) throw new Error('Failed to load')
      const body = await res.json()
      return body.data ?? body
    },
    staleTime: 1000 * 60 * 2,
  })

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['club-announcements', slug] })
  }, [queryClient, slug])

  // 자동 읽음 처리 — 화면에 표시되면 한 번만 POST
  useEffect(() => {
    const announcements = data?.announcements ?? []
    for (const a of announcements) {
      if (seenRef.current.has(a.id)) continue
      // 예약 상태(published_at 없음)는 읽음 처리 안 함
      if (!a.published_at && a.scheduled_at) continue
      seenRef.current.add(a.id)
      fetch(`/api/clubs/${slug}/announcements/${a.id}/read`, { method: 'POST' }).catch(() => {})
    }
  }, [data, slug])

  const handleInsertTemplate = (tpl: typeof TEMPLATES[number]) => {
    setTitle(tpl.title)
    setContent(tpl.body)
  }

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('제목과 내용을 입력해주세요')
      return
    }
    let scheduledAtISO: string | null = null
    if (scheduleDate) {
      const dt = new Date(`${scheduleDate}T${scheduleTime || '09:00'}:00`)
      if (!isNaN(dt.getTime()) && dt.getTime() > Date.now()) {
        scheduledAtISO = dt.toISOString()
      } else {
        toast.error('예약 시각은 미래여야 합니다')
        return
      }
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/clubs/${slug}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          is_pinned: pinNew,
          scheduled_at: scheduledAtISO,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body?.error?.message ?? '공지 작성에 실패했습니다')
        return
      }
      toast.success(scheduledAtISO
        ? '예약 공지가 등록되었습니다 — 지정 시각에 자동 발송됩니다'
        : '공지를 게시했습니다. 등록된 웹훅 채널로도 전송됩니다')
      setTitle('')
      setContent('')
      setPinNew(false)
      setScheduleDate('')
      setScheduleTime('')
      setWriting(false)
      invalidate()
    } finally {
      setSubmitting(false)
    }
  }

  const handleTogglePin = async (a: Announcement) => {
    const res = await fetch(`/api/clubs/${slug}/announcements/${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_pinned: !a.is_pinned }),
    })
    if (res.ok) {
      toast.success(a.is_pinned ? '고정 해제되었습니다' : '고정했습니다')
      invalidate()
    } else {
      toast.error('변경에 실패했습니다')
    }
  }

  const handleDelete = async (a: Announcement) => {
    const res = await fetch(`/api/clubs/${slug}/announcements/${a.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('공지를 삭제했습니다')
      invalidate()
    } else {
      toast.error('삭제에 실패했습니다')
    }
  }

  useEffect(() => {
    if (!writing) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setWriting(false)
        setTitle('')
        setContent('')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [writing])

  const announcements = data?.announcements ?? []

  return (
    <div className="space-y-4">
      {/* 작성 영역 — admin 전용 */}
      {isAdmin && (
        <div className="bg-surface-card border border-border rounded-2xl p-5">
          {!writing ? (
            <button
              onClick={() => setWriting(true)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-[14px] text-txt-tertiary bg-surface-bg border border-border rounded-xl hover:border-brand hover:text-brand transition-colors"
            >
              <Plus size={14} />
              새 공지 작성
            </button>
          ) : (
            <div className="space-y-3">
              {/* 템플릿 */}
              {!title && !content && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[11px] text-txt-tertiary mr-1">
                    <Sparkles size={10} />
                    템플릿:
                  </span>
                  {TEMPLATES.map(t => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => handleInsertTemplate(t)}
                      className="text-[11px] font-medium text-txt-secondary bg-surface-sunken hover:bg-brand-bg hover:text-brand px-2 py-1 rounded-full transition-colors"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
              <input
                value={title}
                onChange={e => setTitle(e.target.value.slice(0, 120))}
                placeholder="예: 3월 정기모임 안내"
                aria-label="공지 제목"
                autoFocus
                className="w-full px-4 py-3 text-[15px] font-bold bg-surface-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
              <textarea
                value={content}
                onChange={e => setContent(e.target.value.slice(0, 4000))}
                placeholder="공지 내용을 작성해 주세요. 등록된 Discord·Slack 웹훅 채널로도 자동 전송됩니다."
                aria-label="공지 내용"
                rows={6}
                className="w-full px-4 py-3 text-[14px] bg-surface-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
              />

              {/* 예약 발송 */}
              <div className="flex items-center gap-2 flex-wrap">
                <Clock size={12} className="text-txt-tertiary" />
                <span className="text-[11px] text-txt-tertiary">예약 발송 (선택):</span>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={e => setScheduleDate(e.target.value)}
                  className="px-2 py-1 text-[12px] bg-surface-bg border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={e => setScheduleTime(e.target.value)}
                  disabled={!scheduleDate}
                  className="px-2 py-1 text-[12px] bg-surface-bg border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-50"
                />
                {scheduleDate && (
                  <button
                    onClick={() => { setScheduleDate(''); setScheduleTime('') }}
                    className="text-[11px] text-txt-tertiary hover:text-txt-primary"
                  >
                    즉시 발송으로
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="flex items-center gap-2 text-[12px] text-txt-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pinNew}
                    onChange={e => setPinNew(e.target.checked)}
                    className="rounded"
                  />
                  <Pin size={11} />
                  상단 고정
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setWriting(false); setTitle(''); setContent(''); setScheduleDate(''); setScheduleTime('') }}
                    className="px-3 py-1.5 text-[13px] font-medium text-txt-secondary hover:text-txt-primary transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={submitting || !title.trim() || !content.trim()}
                    className="ob-press-spring flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-semibold bg-brand text-white rounded-full hover:bg-brand-hover disabled:opacity-50"
                  >
                    {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    {scheduleDate ? '예약' : '게시'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 공지 리스트 */}
      {isLoading ? (
        <div className="h-32 bg-surface-sunken rounded-2xl animate-pulse" />
      ) : announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="아직 공지가 없습니다"
          description={isAdmin
            ? '첫 공지를 작성해 멤버들에게 중요한 소식을 전해보세요'
            : '운영진이 공지를 올리면 여기에 표시됩니다'}
        />
      ) : (
        <ul className="space-y-3">
          {announcements.map(a => (
            <AnnouncementItem
              key={a.id}
              a={a}
              slug={slug}
              isAdmin={isAdmin}
              onTogglePin={handleTogglePin}
              onDelete={(x) => setDeleteTarget(x)}
            />
          ))}
        </ul>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return
          await handleDelete(deleteTarget)
        }}
        title="공지 삭제"
        message={deleteTarget ? `"${deleteTarget.title}" 공지를 삭제합니다.` : ''}
        confirmText="삭제"
        variant="danger"
      />
    </div>
  )
}

function AnnouncementItem({
  a, slug, isAdmin, onTogglePin, onDelete,
}: {
  a: Announcement
  slug: string
  isAdmin: boolean
  onTogglePin: (a: Announcement) => void
  onDelete: (a: Announcement) => void
}) {
  const isScheduled = !a.published_at && !!a.scheduled_at
  const isScheduledFuture = isScheduled && new Date(a.scheduled_at!).getTime() > Date.now()

  const { data: readData } = useQuery<{
    read_count: number
    total_members: number
  }>({
    queryKey: ['announcement-reads', a.id],
    enabled: isAdmin && !isScheduledFuture,
    staleTime: 1000 * 60 * 1,
    queryFn: async () => {
      const res = await fetch(`/api/clubs/${slug}/announcements/${a.id}/read`)
      if (!res.ok) throw new Error('fail')
      const body = await res.json()
      return body.data ?? body
    },
  })

  return (
    <li
      className={`bg-surface-card border rounded-2xl p-5 ${
        a.is_pinned ? 'border-brand-border bg-brand-bg/30' : 'border-border'
      } ${isScheduledFuture ? 'opacity-70' : ''}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {a.is_pinned && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand bg-brand-bg px-2 py-0.5 rounded-full">
              <Pin size={10} />
              고정
            </span>
          )}
          {isScheduledFuture && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indicator-trending bg-status-warning-bg px-2 py-0.5 rounded-full">
              <Clock size={10} />
              예약 {new Date(a.scheduled_at!).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <h3 className="text-[16px] font-bold text-txt-primary">{a.title}</h3>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onTogglePin(a)}
              className="p-1.5 text-txt-disabled hover:text-brand transition-colors rounded-lg hover:bg-surface-sunken"
              aria-label={a.is_pinned ? '고정 해제' : '고정'}
            >
              {a.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
            </button>
            <button
              onClick={() => onDelete(a)}
              className="p-1.5 text-txt-disabled hover:text-status-danger-text transition-colors rounded-lg hover:bg-status-danger-bg"
              aria-label="삭제"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
      <p className="text-[14px] text-txt-secondary leading-relaxed whitespace-pre-line mb-3">
        {a.content}
      </p>
      <div className="flex items-center gap-2 text-[11px] text-txt-tertiary flex-wrap">
        {a.author?.avatar_url ? (
          <Image src={a.author.avatar_url} alt={a.author.nickname} width={16} height={16} className="rounded-full" />
        ) : (
          <div className="w-4 h-4 rounded-full bg-brand-bg flex items-center justify-center text-[9px] font-bold text-brand">
            {a.author?.nickname?.[0] ?? '?'}
          </div>
        )}
        <span>{a.author?.nickname ?? '운영진'}</span>
        <span>·</span>
        <span>{timeAgo(a.created_at)}</span>
        {/* 운영진 전용 읽음 통계 */}
        {isAdmin && readData && !isScheduledFuture && (
          <>
            <span>·</span>
            <span className="inline-flex items-center gap-1 font-semibold">
              <Eye size={10} />
              {readData.read_count}/{readData.total_members} 읽음
            </span>
          </>
        )}
      </div>
    </li>
  )
}
