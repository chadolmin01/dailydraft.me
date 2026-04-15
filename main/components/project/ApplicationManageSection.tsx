'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Loader2, Calendar, Check, X, Coffee, User } from 'lucide-react'
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
        description="프로젝트에 지원자가 생기면 여기에서 관리할 수 있습니다"
      />
    )
  }

  return (
    <div className="px-4 sm:px-8 py-6 space-y-6">
      {/* Pending */}
      {pending.length > 0 && (
        <ApplicationGroup
          title="대기중"
          count={pending.length}
          applications={pending}
          onAction={handleAction}
          isPending={updateApplication.isPending}
          variant="pending"
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
}: {
  title: string
  count: number
  applications: Application[]
  onAction: (app: Application, action: ActionType) => void
  isPending: boolean
  variant: 'pending' | 'interviewing' | 'accepted' | 'rejected'
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
          <ApplicationCard
            key={app.id}
            application={app}
            onAction={onAction}
            isPending={isPending}
            variant={variant}
          />
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
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold border border-border hover:border-brand hover:text-brand transition-colors disabled:opacity-50 rounded-xl"
              >
                {isPending ? <Loader2 size={12} className="animate-spin" /> : <Calendar size={12} />}
                약속잡기
              </button>
              <button
                type="button"
                onClick={() => onAction(application, 'accepted')}
                disabled={isPending}
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
                title="거절"
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
                title="거절"
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
