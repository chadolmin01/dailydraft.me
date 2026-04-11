'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Pencil,
  Check,
  AlertCircle,
  MessageSquare,
  Plus,
  X,
  ChevronRight,
  Star,
  ThumbsDown,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { safeParseContent, type ParsedContent } from '@/src/lib/ghostwriter/parse-content'

/* ─── Types ─── */
interface Draft {
  id: string
  opportunity_id: string
  week_number: number
  title: string
  content: string
  update_type: string
  source_message_count: number
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  reviewed_at?: string
}

type ViewState = 'review' | 'edit' | 'submitted' | 'rejected' | 'nodata' | 'loading' | 'error'

const confidenceLabel = {
  high: { text: '높은 신뢰도', color: 'text-status-success-text', dotBg: 'bg-status-success-text' },
  mid: { text: '보통 신뢰도', color: 'text-status-warning-text', dotBg: 'bg-status-warning-text' },
  low: { text: '낮은 신뢰도', color: 'text-txt-disabled', dotBg: 'bg-txt-disabled' },
}

const statusLabel = {
  good: { text: '순조로움', bg: 'bg-status-success-bg', color: 'text-status-success-text' },
  normal: { text: '보통', bg: 'bg-status-warning-bg', color: 'text-status-warning-text' },
  hard: { text: '어려움', bg: 'bg-red-50', color: 'text-status-danger-text' },
}

/* ─── Confidence Badge ─── */
function ConfidenceBadge({ level, detail }: { level: 'high' | 'mid' | 'low'; detail: string }) {
  const c = confidenceLabel[level]
  return (
    <div className={`flex items-center gap-1.5 mt-2 text-[11px] ${c.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dotBg}`} />
      {c.text} — {detail}
    </div>
  )
}

/* ─── Section Card ─── */
function SectionCard({
  title,
  onEdit,
  label,
  children,
}: {
  title: string
  onEdit?: () => void
  label?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-surface-card border border-border rounded-2xl p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[15px] font-bold text-txt-primary">{title}</span>
        <div className="flex items-center gap-2">
          {label}
          {onEdit && (
            <button
              onClick={onEdit}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-sunken text-txt-tertiary hover:bg-brand/10 hover:text-brand transition-colors"
              aria-label="수정"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}

/* ─── Main Component ─── */
export function DraftReviewClient({ draftId }: { draftId: string }) {
  const router = useRouter()
  const [viewState, setViewState] = useState<ViewState>('loading')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [parsed, setParsed] = useState<ParsedContent | null>(null)
  const [isPublic, setIsPublic] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Feedback state (피드백 루프 — 승인/거절 시 AI 품질 평가)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackScore, setFeedbackScore] = useState(0) // 1~5, 0=미선택
  const [feedbackNote, setFeedbackNote] = useState('')

  // Edit mode state
  const [editSummary, setEditSummary] = useState('')
  const [editTasks, setEditTasks] = useState<{ text: string; done: boolean }[]>([])
  const [editNextPlan, setEditNextPlan] = useState('')
  const [editTeamStatus, setEditTeamStatus] = useState<'good' | 'normal' | 'hard'>('good')
  const [editHelpText, setEditHelpText] = useState('')

  // ── Fetch draft ──
  // AbortController로 StrictMode 이중 렌더링 race condition 방지
  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        const res = await fetch(`/api/ghostwriter/drafts/${draftId}`, {
          signal: controller.signal,
        })
        if (controller.signal.aborted) return

        if (!res.ok) {
          // 401 = 인증 대기 중일 수 있음 → 재시도
          if (res.status === 401) {
            await new Promise(r => setTimeout(r, 500))
            if (controller.signal.aborted) return
            const retry = await fetch(`/api/ghostwriter/drafts/${draftId}`, {
              signal: controller.signal,
            })
            if (controller.signal.aborted) return
            if (!retry.ok) { setViewState('error'); return }
            const retryJson = await retry.json()
            handleData(retryJson)
            return
          }
          setViewState('error')
          return
        }
        const json = await res.json()
        handleData(json)
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return
        setViewState('error')
      }
    }

    function handleData(d: Draft) {
      if (!d) { setViewState('error'); return }
      setDraft(d)

      if (d.status === 'approved') {
        setViewState('submitted')
      } else if (d.status === 'rejected') {
        setViewState('rejected')
      } else if (d.status === 'pending') {
        setViewState('review')
      } else if (d.status === 'expired') {
        setViewState('submitted') // expired = 자동 게시됨, 완료 화면 표시
      } else {
        setViewState('error')
      }

      const p = safeParseContent(d.content)
      setParsed(p)

      // 수정 모드 초기값 세팅
      setEditSummary(p.summary)
      setEditTasks(p.tasks.map(t => ({ text: t.text, done: t.done })))
      setEditNextPlan(p.nextPlan)
      setEditTeamStatus(p.teamStatus)
    }

    load()
    return () => controller.abort()
  }, [draftId])

  // ── Actions ──
  const handleApprove = useCallback(async () => {
    if (!draft || !parsed || submitting) return
    setSubmitting(true)

    try {
      const payload: Record<string, unknown> = { action: 'approve' }
      if (feedbackScore > 0) payload.feedback_score = feedbackScore
      if (feedbackNote.trim()) payload.feedback_note = feedbackNote.trim()

      const res = await fetch(`/api/ghostwriter/drafts/${draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setViewState('submitted')
      }
    } finally {
      setSubmitting(false)
    }
  }, [draft, parsed, draftId, submitting, feedbackScore, feedbackNote])

  const handleReject = useCallback(async () => {
    if (!draft || submitting) return
    setSubmitting(true)

    try {
      const payload: Record<string, unknown> = { action: 'reject' }
      if (feedbackScore > 0) payload.feedback_score = feedbackScore
      if (feedbackNote.trim()) payload.feedback_note = feedbackNote.trim()

      const res = await fetch(`/api/ghostwriter/drafts/${draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setViewState('rejected')
      }
    } finally {
      setSubmitting(false)
    }
  }, [draft, draftId, submitting, feedbackScore, feedbackNote])

  const handleSaveEdit = useCallback(async () => {
    if (!draft || submitting) return
    setSubmitting(true)

    const updatedContent = JSON.stringify({
      summary: editSummary,
      tasks: editTasks,
      nextPlan: editNextPlan,
      teamStatus: editTeamStatus,
      teamStatusReason: editHelpText || parsed?.teamStatusReason || '',
    })

    try {
      const res = await fetch(`/api/ghostwriter/drafts/${draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          title: draft.title,
          content: updatedContent,
        }),
      })
      if (res.ok) {
        const d = await res.json() as Draft
        setDraft(d)
        const p = safeParseContent(d.content)
        setParsed(p)
        setViewState('review')
      }
    } finally {
      setSubmitting(false)
    }
  }, [draft, draftId, editSummary, editTasks, editNextPlan, editTeamStatus, editHelpText, parsed])

  const handleSubmitFromEdit = useCallback(async () => {
    // 먼저 수정 사항 저장 → 승인
    if (!draft || submitting) return
    setSubmitting(true)

    const updatedContent = JSON.stringify({
      summary: editSummary,
      tasks: editTasks,
      nextPlan: editNextPlan,
      teamStatus: editTeamStatus,
      teamStatusReason: editHelpText || parsed?.teamStatusReason || '',
    })

    try {
      // 1. 수정 저장
      await fetch(`/api/ghostwriter/drafts/${draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit', title: draft.title, content: updatedContent }),
      })

      // 2. 승인
      const res = await fetch(`/api/ghostwriter/drafts/${draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      if (res.ok) {
        setViewState('submitted')
      }
    } finally {
      setSubmitting(false)
    }
  }, [draft, draftId, editSummary, editTasks, editNextPlan, editTeamStatus, editHelpText, parsed])

  // ── Loading / Error ──
  if (viewState === 'loading') {
    return (
      <div className="max-w-[600px] mx-auto px-5 py-24">
        <div className="space-y-4 animate-pulse">
          <div className="h-4 bg-surface-sunken rounded w-24" />
          <div className="h-6 bg-surface-sunken rounded w-48" />
          <div className="h-4 bg-surface-sunken rounded w-full" />
          <div className="h-32 bg-surface-sunken rounded-2xl" />
          <div className="h-32 bg-surface-sunken rounded-2xl" />
        </div>
      </div>
    )
  }

  if (viewState === 'error') {
    return (
      <div className="max-w-[600px] mx-auto px-5 py-24 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-sunken flex items-center justify-center">
          <AlertCircle size={28} className="text-txt-tertiary" strokeWidth={1.5} />
        </div>
        <p className="font-bold text-txt-primary mb-1">초안을 불러올 수 없습니다</p>
        <p className="text-sm text-txt-tertiary mb-5">존재하지 않거나 접근 권한이 없습니다.</p>
        <Button variant="ghost" onClick={() => router.back()}>
          돌아가기
        </Button>
      </div>
    )
  }

  if (viewState === 'nodata') {
    return <NodataView onManualWrite={() => setViewState('edit')} />
  }

  if (viewState === 'submitted') {
    return <SubmittedView draft={draft!} parsed={parsed!} onBack={() => router.push('/dashboard')} />
  }

  if (viewState === 'rejected') {
    return <RejectedView onBack={() => router.push('/dashboard')} />
  }

  if (!draft || !parsed) return null

  // ── Review State ──
  if (viewState === 'review') {
    return (
      <>
        <div className="max-w-[600px] mx-auto px-5 pt-6 pb-36">
          {/* Header */}
          <div className="mb-6">
            <p className="text-[13px] text-txt-tertiary mb-1">{draft.title}</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand/10 text-brand mb-2">
              {draft.week_number}주차
            </span>
            <h1 className="text-xl font-bold text-txt-primary mb-2">이번 주 활동을 정리했습니다</h1>
            <p className="text-sm text-txt-secondary leading-relaxed">
              Discord 대화를 분석하여 주간 업데이트 초안을 작성했습니다. 확인 후 제출해주세요.
            </p>
            {draft.source_message_count > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-surface-sunken rounded-lg text-xs text-txt-tertiary mt-3">
                <span className="w-4 h-4 rounded bg-[#5865F2] text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                  D
                </span>
                메시지 {draft.source_message_count}건에서 생성
              </div>
            )}
          </div>

          {/* 이번 주 요약 */}
          {parsed.summary && (
            <SectionCard title="이번 주 요약" onEdit={() => setViewState('edit')}>
              <p className="text-sm text-txt-secondary leading-relaxed">{parsed.summary}</p>
              <ConfidenceBadge level={parsed.confidence.summary} detail="관련 메시지에서 추출" />
            </SectionCard>
          )}

          {/* 완료한 작업 */}
          {parsed.tasks.length > 0 && (
            <SectionCard title="완료한 작업" onEdit={() => setViewState('edit')}>
              <div className="space-y-2.5">
                {parsed.tasks.map((task, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm">
                    <div
                      className={`w-[18px] h-[18px] rounded shrink-0 flex items-center justify-center mt-0.5 ${
                        task.done ? 'bg-brand' : 'bg-status-warning-bg border-2 border-status-warning-text'
                      }`}
                    >
                      {task.done && <Check size={10} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className={`flex-1 ${task.done ? 'line-through text-txt-tertiary' : 'text-txt-primary'}`}>
                      {task.text}
                    </span>
                    {task.source && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded bg-surface-sunken text-[11px] text-txt-tertiary">
                        {task.source}
                      </span>
                    )}
                    {task.member && (
                      <span className="shrink-0 px-2 py-0.5 rounded bg-brand/10 text-[11px] text-brand">
                        {task.member}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <ConfidenceBadge level={parsed.confidence.tasks} detail="작업 완료 메시지에서 추출" />
            </SectionCard>
          )}

          {/* 다음 주 계획 */}
          {parsed.nextPlan && (
            <SectionCard title="다음 주 계획" onEdit={() => setViewState('edit')}>
              <p className="text-sm text-txt-secondary leading-relaxed">{parsed.nextPlan}</p>
              <ConfidenceBadge level={parsed.confidence.nextPlan} detail="대화 맥락에서 추론" />
            </SectionCard>
          )}

          {/* 팀 상태 */}
          <SectionCard title="팀 상태" onEdit={() => setViewState('edit')}>
            <div className="flex items-center gap-2.5">
              <span
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold ${statusLabel[parsed.teamStatus].bg} ${statusLabel[parsed.teamStatus].color}`}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                {statusLabel[parsed.teamStatus].text}
              </span>
            </div>
            {parsed.teamStatusReason && (
              <p className="text-[13px] text-txt-tertiary mt-2 leading-relaxed">{parsed.teamStatusReason}</p>
            )}
            <ConfidenceBadge level={parsed.confidence.teamStatus} detail="대화 톤과 진행 상황에서 판단" />
          </SectionCard>
        </div>

        {/* Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-border z-50 px-5 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3">
          <div className="max-w-[600px] mx-auto">
            {/* AI 피드백 토글 */}
            {showFeedback && (
              <div className="mb-3 p-3 bg-surface-sunken rounded-xl">
                <p className="text-xs font-semibold text-txt-secondary mb-2">AI 초안 품질 평가</p>
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setFeedbackScore(feedbackScore === score ? 0 : score)}
                      className="p-1"
                    >
                      <Star
                        size={20}
                        className={feedbackScore >= score ? 'text-amber-400 fill-amber-400' : 'text-border'}
                        strokeWidth={1.5}
                      />
                    </button>
                  ))}
                  <span className="text-xs text-txt-tertiary ml-1 self-center">
                    {feedbackScore === 0 ? '' : feedbackScore <= 2 ? '개선 필요' : feedbackScore <= 4 ? '괜찮음' : '정확함'}
                  </span>
                </div>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm text-txt-primary focus:outline-none focus:border-brand"
                  placeholder="어떤 점이 아쉬웠나요? (선택)"
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                  maxLength={200}
                />
              </div>
            )}

            {/* 공개 토글 */}
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setIsPublic(!isPublic)}
                className="flex items-center gap-2.5"
              >
                <div className={`w-[42px] h-6 rounded-full relative transition-colors ${isPublic ? 'bg-brand' : 'bg-border'}`}>
                  <div
                    className={`w-5 h-5 rounded-full bg-white absolute top-0.5 shadow-sm transition-transform ${isPublic ? 'translate-x-[18px]' : 'translate-x-0.5'}`}
                  />
                </div>
                <span className={`text-[13px] font-semibold ${isPublic ? 'text-brand' : 'text-txt-secondary'}`}>
                  탐색 피드에 공개
                </span>
              </button>
              <button
                onClick={() => setShowFeedback(!showFeedback)}
                className="text-xs text-txt-tertiary hover:text-txt-secondary transition-colors"
              >
                {showFeedback ? '피드백 접기' : 'AI 피드백 남기기'}
              </button>
            </div>

            <div className="flex gap-2 mb-2">
              <Button variant="ghost" onClick={() => setViewState('edit')}>
                수정할게요
              </Button>
              {showFeedback && feedbackScore > 0 && feedbackScore <= 2 && (
                <Button
                  variant="ghost"
                  loading={submitting}
                  onClick={handleReject}
                  className="!text-status-danger-text"
                >
                  거절
                </Button>
              )}
              <Button variant="blue" fullWidth loading={submitting} onClick={handleApprove}>
                이대로 제출
              </Button>
            </div>
            <p className="text-xs text-txt-tertiary text-center">30초면 완료됩니다</p>
          </div>
        </div>
      </>
    )
  }

  // ── Edit State ──
  return (
    <>
      <div className="max-w-[600px] mx-auto px-5 pt-6 pb-36">
        {/* Header */}
        <div className="mb-6">
          <p className="text-[13px] text-txt-tertiary mb-1">{draft.title}</p>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand/10 text-brand mb-2">
            {draft.week_number}주차
          </span>
          <h1 className="text-xl font-bold text-txt-primary mb-2">초안을 수정합니다</h1>
          <p className="text-sm text-txt-secondary leading-relaxed">
            AI가 작성한 내용을 자유롭게 수정하세요. 항목을 추가하거나 삭제할 수 있습니다.
          </p>
        </div>

        {/* 이번 주 요약 */}
        <div className="mb-5">
          <label className="text-[15px] font-bold text-txt-primary mb-2.5 block">이번 주 요약</label>
          <textarea
            className="w-full px-4 py-3 border border-border rounded-xl text-sm text-txt-primary leading-relaxed resize-y focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
            rows={3}
            value={editSummary}
            onChange={e => setEditSummary(e.target.value)}
          />
        </div>

        {/* 완료한 작업 */}
        <div className="mb-5">
          <label className="text-[15px] font-bold text-txt-primary mb-2.5 block">완료한 작업</label>
          <div className="space-y-2">
            {editTasks.map((task, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 px-3.5 py-2.5 border border-border rounded-lg bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/10"
              >
                <button
                  type="button"
                  onClick={() => {
                    const next = [...editTasks]
                    next[i] = { ...next[i], done: !next[i].done }
                    setEditTasks(next)
                  }}
                  className={`w-[18px] h-[18px] rounded shrink-0 flex items-center justify-center transition-colors ${
                    task.done ? 'bg-brand border-brand' : 'border-2 border-border bg-white'
                  }`}
                >
                  {task.done && <Check size={10} className="text-white" strokeWidth={3} />}
                </button>
                <input
                  type="text"
                  className={`flex-1 border-none outline-none text-sm bg-transparent ${
                    task.done ? 'line-through text-txt-tertiary' : 'text-txt-primary'
                  }`}
                  placeholder="할 일을 입력하세요"
                  value={task.text}
                  onChange={e => {
                    const next = [...editTasks]
                    next[i] = { ...next[i], text: e.target.value }
                    setEditTasks(next)
                  }}
                />
                <button
                  type="button"
                  onClick={() => setEditTasks(editTasks.filter((_, j) => j !== i))}
                  className="w-5 h-5 flex items-center justify-center rounded-full text-txt-disabled hover:text-status-danger-text hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  // opacity trick: 항상 보이게 처리 (터치에서는 hover 없음)
                  style={{ opacity: 1 }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setEditTasks([...editTasks, { text: '', done: false }])}
            className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-brand hover:text-brand/80 transition-colors"
          >
            <Plus size={14} /> 항목 추가
          </button>
        </div>

        {/* 다음 주 계획 */}
        <div className="mb-5">
          <label className="text-[15px] font-bold text-txt-primary mb-2.5 block">다음 주 계획</label>
          <textarea
            className="w-full px-4 py-3 border border-border rounded-xl text-sm text-txt-primary leading-relaxed resize-y focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
            rows={3}
            value={editNextPlan}
            onChange={e => setEditNextPlan(e.target.value)}
          />
        </div>

        {/* 팀 상태 */}
        <div className="mb-5">
          <label className="text-[15px] font-bold text-txt-primary mb-2.5 block">팀 상태</label>
          <div className="flex gap-2 flex-wrap">
            {(['good', 'normal', 'hard'] as const).map(status => {
              const s = statusLabel[status]
              const selected = editTeamStatus === status
              const dotColors = {
                good: 'bg-status-success-text',
                normal: 'bg-status-warning-text',
                hard: 'bg-status-danger-text',
              }
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setEditTeamStatus(status)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                    selected
                      ? `${s.bg} ${s.color} border-current`
                      : 'border-border text-txt-secondary bg-white hover:border-txt-tertiary'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${dotColors[status]}`} />
                  {s.text}
                </button>
              )
            })}
          </div>
          {editTeamStatus === 'hard' && (
            <div className="mt-3">
              <label className="text-[15px] font-bold text-txt-primary mb-2.5 block">어떤 부분이 어려우신가요?</label>
              <textarea
                className="w-full px-4 py-3 border border-border rounded-xl text-sm text-txt-primary leading-relaxed resize-y focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
                rows={2}
                placeholder="겪고 있는 어려움을 적어주시면 팀원이나 멘토가 도움을 드릴 수 있습니다"
                value={editHelpText}
                onChange={e => setEditHelpText(e.target.value)}
              />
            </div>
          )}
        </div>

      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-border z-50 px-5 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3">
        <div className="max-w-[600px] mx-auto">
          <button
            onClick={() => setIsPublic(!isPublic)}
            className="flex items-center gap-2.5 mb-2 w-full"
          >
            <div className={`w-[42px] h-6 rounded-full relative transition-colors ${isPublic ? 'bg-brand' : 'bg-border'}`}>
              <div
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 shadow-sm transition-transform ${isPublic ? 'translate-x-[18px]' : 'translate-x-0.5'}`}
              />
            </div>
            <span className={`text-[13px] font-semibold ${isPublic ? 'text-brand' : 'text-txt-secondary'}`}>
              탐색 피드에 공개
            </span>
          </button>

          <div className="flex gap-2 mb-2">
            <Button variant="ghost" fullWidth onClick={() => setViewState('review')}>
              초안으로 돌아가기
            </Button>
            <Button variant="blue" fullWidth loading={submitting} onClick={handleSubmitFromEdit}>
              제출하기
            </Button>
          </div>
          <p className="text-xs text-txt-tertiary text-center">제출 후 팀원에게 알림이 전송됩니다</p>
        </div>
      </div>
    </>
  )
}

/* ─── Nodata View ─── */
function NodataView({ onManualWrite }: { onManualWrite: () => void }) {
  return (
    <div className="max-w-[600px] mx-auto px-5 pt-10 pb-24 text-center">
      <div className="w-[120px] h-[120px] mx-auto mb-5 bg-surface-sunken rounded-full flex items-center justify-center">
        <MessageSquare size={48} className="text-txt-disabled" strokeWidth={1.5} />
      </div>
      <h2 className="text-lg font-bold text-txt-primary mb-2">Discord가 아직 연결되지 않았습니다</h2>
      <p className="text-sm text-txt-secondary leading-relaxed mb-6">
        Discord를 연결하면 팀 대화를 분석하여
        <br />
        주간 업데이트를 자동으로 작성해 드립니다.
      </p>

      <div className="text-left bg-surface-sunken rounded-xl p-5 mb-6">
        {[
          { num: 1, text: '프로젝트 설정에서 Discord 서버를 연결합니다', hint: '설정 > 연동 > Discord' },
          { num: 2, text: 'Draft 봇이 채널의 메시지를 읽을 수 있도록 권한을 부여합니다', hint: '읽기 권한만 필요합니다' },
          { num: 3, text: '매주 금요일, AI가 대화를 분석하여 초안을 작성합니다', hint: '검토 후 30초면 제출 완료' },
        ].map(step => (
          <div key={step.num} className="flex items-start gap-3 mb-4 last:mb-0">
            <div className="w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              {step.num}
            </div>
            <div className="text-sm text-txt-primary leading-relaxed">
              {step.text}
              <br />
              <span className="text-[13px] text-txt-tertiary">{step.hint}</span>
            </div>
          </div>
        ))}
      </div>

      <Button variant="blue" fullWidth size="lg" className="mb-3">
        Discord 연결하기
      </Button>
      <Button variant="ghost" fullWidth onClick={onManualWrite}>
        수동으로 작성하기
      </Button>
    </div>
  )
}

/* ─── Rejected View ─── */
function RejectedView({ onBack }: { onBack: () => void }) {
  return (
    <div className="max-w-[600px] mx-auto px-5 pt-12 pb-24 text-center">
      <div className="w-20 h-20 mx-auto mb-5 bg-surface-sunken rounded-full flex items-center justify-center">
        <ThumbsDown size={36} className="text-txt-tertiary" strokeWidth={1.5} />
      </div>
      <h2 className="text-xl font-bold text-txt-primary mb-2">초안을 거절했습니다</h2>
      <p className="text-sm text-txt-secondary mb-6 leading-relaxed">
        피드백이 기록되었습니다. 다음 주 AI가 개선된 초안을 작성합니다.
        <br />
        직접 주간 업데이트를 작성하실 수도 있습니다.
      </p>
      <div className="space-y-2">
        <Button variant="blue" fullWidth onClick={onBack}>
          대시보드로 돌아가기
        </Button>
      </div>
    </div>
  )
}

/* ─── Submitted View ─── */
function SubmittedView({
  draft,
  parsed,
  onBack,
}: {
  draft: Draft
  parsed: ParsedContent
  onBack: () => void
}) {
  return (
    <div className="max-w-[600px] mx-auto px-5 pt-12 pb-24 text-center">
      <div className="w-20 h-20 mx-auto mb-5 bg-status-success-bg rounded-full flex items-center justify-center">
        <Check size={40} className="text-status-success-text" strokeWidth={2} />
      </div>
      <h2 className="text-xl font-bold text-txt-primary mb-2">주간 업데이트가 제출되었습니다</h2>
      <p className="text-sm text-txt-secondary mb-6 leading-relaxed">
        팀원에게 알림이 전송되었습니다.
        <br />
        수고하셨습니다!
      </p>

      <div className="bg-surface-sunken rounded-xl p-5 mb-6 text-left">
        {[
          { label: '프로젝트', value: draft.title },
          { label: '주차', value: `${draft.week_number}주차` },
          { label: '완료 작업', value: `${parsed.tasks.filter(t => t.done).length}건` },
          { label: '팀 상태', value: statusLabel[parsed.teamStatus].text, color: statusLabel[parsed.teamStatus].color },
          {
            label: '제출 시각',
            value: new Date(draft.reviewed_at || draft.created_at).toLocaleString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
        ].map((row, i, arr) => (
          <div
            key={row.label}
            className={`flex justify-between items-center py-2 text-sm ${i < arr.length - 1 ? 'border-b border-border' : ''}`}
          >
            <span className="text-txt-tertiary">{row.label}</span>
            <span className={`font-semibold ${row.color || 'text-txt-primary'}`}>{row.value}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Button variant="blue" fullWidth onClick={onBack}>
          대시보드로 돌아가기
        </Button>
      </div>
    </div>
  )
}
