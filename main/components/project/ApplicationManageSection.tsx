'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Loader2, Calendar, Check, X, Coffee, User, CheckSquare, Square } from 'lucide-react'
import { toast } from 'sonner'
import { SkeletonFeed } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { positionLabel } from '@/src/constants/roles'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { timeAgo } from '@/src/lib/utils'

interface ApplicationProfile {
  user_id: string
  nickname: string | null
  skills: Array<{ name: string; level: string }> | null
  interest_tags: string[] | null
  desired_position: string | null
}

interface Application {
  id: string
  applicant_id: string
  opportunity_id: string
  status: string
  intro: string | null
  match_score: number | null
  match_reason: string | null
  created_at: string
  profiles: ApplicationProfile | null
  opportunities: {
    id: string
    title: string
    type: string
    creator_id: string
  } | null
}

type ActionType = 'interviewing' | 'accepted' | 'rejected'

export function ApplicationManageSection({ opportunityId }: { opportunityId: string }) {
  const queryClient = useQueryClient()
  const [confirmAction, setConfirmAction] = useState<{ app: Application; action: ActionType } | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkConfirm, setBulkConfirm] = useState<ActionType | null>(null)
  const [bulkRunning, setBulkRunning] = useState(false)

  const toggleId = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Fetch applications for this opportunity
  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: ['applications', opportunityId],
    queryFn: async () => {
      const res = await fetch(`/api/applications?type=received&opportunityId=${opportunityId}`)
      if (!res.ok) throw new Error('Failed to fetch applications')
      const json = await res.json()
      return Array.isArray(json) ? json : json.data || []
    },
  })

  const updateApplication = useMutation({
    mutationFn: async ({ id, status, message }: { id: string; status: string; message?: string }) => {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, message }),
      })
      if (!res.ok) throw new Error('Failed to update application')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', opportunityId] })
      queryClient.invalidateQueries({ queryKey: ['pending-count'] })
      queryClient.invalidateQueries({ queryKey: ['team', opportunityId] })
      queryClient.invalidateQueries({ queryKey: ['coffee_chats'] })
      setConfirmAction(null)
    },
    onError: () => {
      toast.error('처리에 실패했습니다. 다시 시도해주세요.')
      setConfirmAction(null)
    },
  })

  const handleAction = (app: Application, action: ActionType) => {
    if (action === 'rejected') {
      setConfirmAction({ app, action })
      return
    }
    executeAction(app, action)
  }

  const executeAction = (app: Application, action: ActionType) => {
    const messages: Record<ActionType, string> = {
      interviewing: '약속이 잡혔습니다',
      accepted: '합류를 환영합니다!',
      rejected: '',
    }
    const toastMessages: Record<ActionType, string> = {
      interviewing: '약속잡기가 완료되었습니다. 커피챗이 생성되었습니다.',
      accepted: '지원자가 팀에 추가되었습니다.',
      rejected: '지원이 거절되었습니다.',
    }
    updateApplication.mutate(
      { id: app.id, status: action, message: messages[action] },
      { onSuccess: () => toast.success(toastMessages[action]) }
    )
  }

  if (isLoading) {
    return (
      <div className="px-4 sm:px-8 py-6">
        <SkeletonFeed count={3} />
      </div>
    )
  }

  // Group by status
  const pending = applications.filter(a => a.status === 'pending')
  const interviewing = applications.filter(a => a.status === 'interviewing')
  const accepted = applications.filter(a => a.status === 'accepted')
  const rejected = applications.filter(a => a.status === 'rejected' || a.status === 'declined')

  if (applications.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="아직 지원자가 없습니다"
        description="프로젝트 링크를 공유해 후보를 모아보세요"
        actionLabel="맞는 사람 찾기"
        actionHref="/explore?scope=people"
      />
    )
  }

  const pendingIds = pending.map(p => p.id)
  const allPendingSelected = bulkMode && pendingIds.length > 0 && pendingIds.every(id => selectedIds.has(id))

  const runBulkAction = async (action: ActionType) => {
    if (selectedIds.size === 0) return
    setBulkRunning(true)
    const messages: Record<ActionType, string> = {
      interviewing: '약속이 잡혔습니다',
      accepted: '합류를 환영합니다!',
      rejected: '',
    }
    let ok = 0
    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/applications/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: action, message: messages[action] }),
        })
        if (res.ok) ok += 1
      } catch {}
    }
    setBulkRunning(false)
    setBulkConfirm(null)
    setSelectedIds(new Set())
    setBulkMode(false)
    queryClient.invalidateQueries({ queryKey: ['applications', opportunityId] })
    queryClient.invalidateQueries({ queryKey: ['pending-count'] })
    queryClient.invalidateQueries({ queryKey: ['team', opportunityId] })
    if (ok > 0) toast.success(`${ok}건을 처리했습니다`)
    else toast.error('처리에 실패했습니다')
  }

  return (
    <div className="px-4 sm:px-8 py-6 space-y-6">
      {/* Bulk Actions Bar — pending >= 3 */}
      {pending.length >= 3 && (
        <div className="bg-surface-card border border-border rounded-2xl p-4 flex items-center gap-3 flex-wrap">
          <button
            onClick={() => {
              const next = !bulkMode
              setBulkMode(next)
              if (!next) setSelectedIds(new Set())
            }}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-txt-primary"
          >
            {bulkMode ? <CheckSquare size={14} className="text-brand" /> : <Square size={14} className="text-txt-tertiary" />}
            일괄 선택 모드
          </button>
          {bulkMode && (
            <>
              <button
                onClick={() => {
                  setSelectedIds(allPendingSelected ? new Set() : new Set(pendingIds))
                }}
                className="text-[12px] text-txt-tertiary hover:text-txt-primary transition-colors"
              >
                {allPendingSelected ? '전체 해제' : '전체 선택'}
              </button>
              <span className="text-[12px] text-txt-tertiary ml-auto">
                {selectedIds.size}건 선택
              </span>
              <button
                disabled={selectedIds.size === 0 || bulkRunning}
                onClick={() => setBulkConfirm('interviewing')}
                className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-brand bg-brand-bg rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <Coffee size={11} />
                면담 제안
              </button>
              <button
                disabled={selectedIds.size === 0 || bulkRunning}
                onClick={() => setBulkConfirm('rejected')}
                className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-status-danger-text bg-status-danger-bg rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <X size={11} />
                거절
              </button>
            </>
          )}
        </div>
      )}

      {/* Pending */}
      {pending.length > 0 && (
        <ApplicationGroup
          title="대기중"
          count={pending.length}
          applications={pending}
          onAction={handleAction}
          isPending={updateApplication.isPending}
          variant="pending"
          bulkMode={bulkMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleId}
        />
      )}

      {/* Interviewing */}
      {interviewing.length > 0 && (
        <ApplicationGroup
          title="면담 진행중"
          count={interviewing.length}
          applications={interviewing}
          onAction={handleAction}
          isPending={updateApplication.isPending}
          variant="interviewing"
        />
      )}

      {/* Accepted */}
      {accepted.length > 0 && (
        <ApplicationGroup
          title="합류 확정"
          count={accepted.length}
          applications={accepted}
          onAction={handleAction}
          isPending={updateApplication.isPending}
          variant="accepted"
        />
      )}

      {/* Rejected */}
      {rejected.length > 0 && (
        <ApplicationGroup
          title="거절됨"
          count={rejected.length}
          applications={rejected}
          onAction={handleAction}
          isPending={updateApplication.isPending}
          variant="rejected"
        />
      )}

      {/* Reject Confirm Modal */}
      <ConfirmModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction) executeAction(confirmAction.app, confirmAction.action)
        }}
        title="지원을 거절할까요?"
        message={`${confirmAction?.app.profiles?.nickname || '지원자'}님의 지원을 거절합니다. 이 작업은 되돌릴 수 없습니다.`}
        confirmText="거절하기"
        cancelText="취소"
        variant="danger"
      />

      {/* Bulk Confirm Modal */}
      <ConfirmModal
        isOpen={!!bulkConfirm}
        onClose={() => setBulkConfirm(null)}
        onConfirm={() => {
          if (bulkConfirm) void runBulkAction(bulkConfirm)
        }}
        title={
          bulkConfirm === 'rejected'
            ? `${selectedIds.size}건의 지원을 거절할까요?`
            : `${selectedIds.size}건에 면담을 제안할까요?`
        }
        message={
          bulkConfirm === 'rejected'
            ? '선택한 지원자들에게 거절 처리됩니다. 이 작업은 되돌릴 수 없습니다.'
            : '선택한 지원자들에게 커피챗이 생성됩니다.'
        }
        confirmText={bulkConfirm === 'rejected' ? '거절하기' : '면담 제안'}
        cancelText="취소"
        variant={bulkConfirm === 'rejected' ? 'danger' : 'info'}
      />
    </div>
  )
}

function ApplicationGroup({
  title,
  count,
  applications,
  onAction,
  isPending,
  variant,
  bulkMode,
  selectedIds,
  onToggleSelect,
}: {
  title: string
  count: number
  applications: Application[]
  onAction: (app: Application, action: ActionType) => void
  isPending: boolean
  variant: 'pending' | 'interviewing' | 'accepted' | 'rejected'
  bulkMode?: boolean
  selectedIds?: Set<string>
  onToggleSelect?: (id: string) => void
}) {
  return (
    <div>
      <h4 className="text-[10px] font-medium text-txt-tertiary mb-2 flex items-center gap-1.5">
        {variant === 'pending' && <User size={11} />}
        {variant === 'interviewing' && <Coffee size={11} />}
        {variant === 'accepted' && <Check size={11} />}
        {variant === 'rejected' && <X size={11} />}
        {title} ({count})
      </h4>
      <div className="space-y-2">
        {applications.map(app => (
          <div key={app.id} className="flex items-start gap-2">
            {bulkMode && variant === 'pending' && onToggleSelect && (
              <button
                onClick={() => onToggleSelect(app.id)}
                className="pt-5 shrink-0"
                aria-label={selectedIds?.has(app.id) ? '선택 해제' : '선택'}
              >
                {selectedIds?.has(app.id) ? (
                  <CheckSquare size={16} className="text-brand" />
                ) : (
                  <Square size={16} className="text-txt-tertiary" />
                )}
              </button>
            )}
            <div className="flex-1 min-w-0">
              <ApplicationCard
                application={app}
                onAction={onAction}
                isPending={isPending}
                variant={variant}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ApplicationCard({
  application,
  onAction,
  isPending,
  variant,
}: {
  application: Application
  onAction: (app: Application, action: ActionType) => void
  isPending: boolean
  variant: 'pending' | 'interviewing' | 'accepted' | 'rejected'
}) {
  const profile = application.profiles
  const nickname = profile?.nickname || '알 수 없음'

  return (
    <div className={`border border-border bg-surface-card rounded-xl ${variant === 'rejected' ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Avatar */}
        <div className={`w-10 h-10 flex items-center justify-center font-bold text-sm shrink-0 rounded-full ${
          variant === 'accepted'
            ? 'bg-status-success-text text-white'
            : variant === 'interviewing'
              ? 'bg-brand text-white'
              : 'bg-surface-inverse text-txt-inverse'
        }`}>
          {nickname.charAt(0)}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-sm text-txt-primary">{nickname}</p>
            {application.match_score != null && (
              <span className="text-[10px] font-bold text-brand bg-brand-bg px-1.5 py-0.5 border border-brand-border rounded-full">
                {application.match_score}% 매치
              </span>
            )}
          </div>
          <p className="text-xs text-txt-disabled">
            {positionLabel(profile?.desired_position || '') || '포지션 미설정'}
            {' · '}
            {timeAgo(application.created_at)}
          </p>

          {/* Skills */}
          {profile?.skills && profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {profile.skills.slice(0, 5).map((skill, i) => (
                <span key={i} className="text-[10px] bg-surface-sunken text-txt-secondary px-1.5 py-0.5 border border-border rounded-lg">
                  {skill.name}
                </span>
              ))}
            </div>
          )}

          {/* Intro */}
          {application.intro && (
            <p className="text-xs text-txt-secondary mt-2 line-clamp-2">{application.intro}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {variant === 'pending' && (
            <>
              <button
                type="button"
                onClick={() => onAction(application, 'interviewing')}
                disabled={isPending}
                title="먼저 짧게 이야기를 나누신 뒤 결정하실 때 사용합니다"
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold border border-border hover:border-brand hover:text-brand transition-colors disabled:opacity-50 rounded-xl"
              >
                {isPending ? <Loader2 size={12} className="animate-spin" /> : <Calendar size={12} />}
                약속잡기
              </button>
              <button
                type="button"
                onClick={() => onAction(application, 'accepted')}
                disabled={isPending}
                title="팀에 바로 합류시키고 지원자에게 수락 알림이 발송됩니다"
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold bg-surface-inverse text-white hover:opacity-90 transition-opacity disabled:opacity-50 rounded-xl"
              >
                {isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                바로 수락
              </button>
              <button
                type="button"
                onClick={() => onAction(application, 'rejected')}
                disabled={isPending}
                className="p-1.5 text-txt-disabled hover:text-status-danger-text transition-colors disabled:opacity-50"
                title="거절 · 지원자에게 결과 알림이 발송됩니다"
                aria-label="지원 거절 (지원자에게 알림이 발송됩니다)"
              >
                <X size={14} />
              </button>
            </>
          )}

          {variant === 'interviewing' && (
            <>
              <button
                type="button"
                onClick={() => onAction(application, 'accepted')}
                disabled={isPending}
                title="대화를 마친 뒤 합류를 확정합니다. 지원자에게 수락 알림이 발송됩니다."
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold bg-surface-inverse text-white hover:opacity-90 transition-opacity disabled:opacity-50 rounded-xl"
              >
                {isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                합류 확정
              </button>
              <button
                type="button"
                onClick={() => onAction(application, 'rejected')}
                disabled={isPending}
                className="p-1.5 text-txt-disabled hover:text-status-danger-text transition-colors disabled:opacity-50"
                title="거절 · 지원자에게 결과 알림이 발송됩니다"
                aria-label="지원 거절 (지원자에게 알림이 발송됩니다)"
              >
                <X size={14} />
              </button>
            </>
          )}

          {variant === 'accepted' && (
            <span className="text-[10px] text-status-success-text font-bold px-2 py-0.5 bg-status-success-bg border border-status-success-text/30 rounded-full">
              합류됨
            </span>
          )}

          {variant === 'rejected' && (
            <span className="text-[10px] font-mono text-txt-disabled">
              거절됨
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
