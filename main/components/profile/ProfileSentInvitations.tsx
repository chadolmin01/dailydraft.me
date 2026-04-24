'use client'

import { useState } from 'react'
import { Send, Bell, X, RotateCw } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonFeed } from '@/components/ui/Skeleton'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import {
  useProjectInvitations,
  useCancelInvitation,
  useRemindInvitation,
  useCreateInvitation,
} from '@/src/hooks/useProjectInvitations'

export function ProfileSentInvitations() {
  const { data: sent = [], isLoading } = useProjectInvitations({ asSender: true })
  const cancelInvitation = useCancelInvitation()
  const remindInvitation = useRemindInvitation()
  const createInvitation = useCreateInvitation()
  const [cancelTarget, setCancelTarget] = useState<string | null>(null)

  const handleCancel = async (id: string) => {
    try {
      await cancelInvitation.mutateAsync(id)
      toast.success('초대를 취소했습니다')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '취소 실패')
    }
  }

  const handleRemind = async (id: string) => {
    try {
      await remindInvitation.mutateAsync(id)
      toast.success('리마인더를 보냈습니다')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '리마인더 실패')
    }
  }

  // 재발송: declined/expired였던 초대를 같은 사람·역할로 다시 POST
  // (서버 30일 쿨다운 정책은 그대로 적용됨)
  const handleResend = async (inv: { opportunity_id: string; invited_user_id: string; role: string; message: string | null }) => {
    try {
      await createInvitation.mutateAsync({
        opportunity_id: inv.opportunity_id,
        invited_user_id: inv.invited_user_id,
        role: inv.role,
        message: inv.message || undefined,
      })
      toast.success('다시 초대를 보냈습니다')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '재발송 실패')
    }
  }

  // pending이 24h 넘었는지 (리마인더 권유)
  const isStale = (createdAt: string, lastReminder: string | null | undefined) => {
    const ref = lastReminder ? new Date(lastReminder).getTime() : new Date(createdAt).getTime()
    return Date.now() - ref > 24 * 60 * 60 * 1000
  }

  return (
    <section className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[10px] font-medium text-txt-tertiary flex items-center gap-2">
          <span className="w-5 h-5 bg-brand text-white flex items-center justify-center text-[0.5rem] font-bold">S</span>
          SENT INVITATIONS
          {sent.filter(i => i.status === 'pending').length > 0 && (
            <span className="text-[10px] font-mono font-bold bg-surface-sunken text-txt-secondary px-1.5 py-0.5">
              {sent.filter(i => i.status === 'pending').length} PENDING
            </span>
          )}
        </h3>
      </div>

      {isLoading ? (
        <SkeletonFeed count={2} />
      ) : sent.length > 0 ? (
        <div className="space-y-3">
          {sent.map(inv => {
            const opp = inv.opportunity
            const stale = inv.status === 'pending' && isStale(inv.created_at, inv.last_reminder_at)
            return (
              <div key={inv.id} className="bg-surface-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {opp && <h4 className="text-sm font-bold text-txt-primary truncate">{opp.title}</h4>}
                      <span className="text-[10px] font-mono font-bold bg-brand-bg text-brand px-1.5 py-0.5 border border-brand-border">
                        {inv.role}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 border ${
                        inv.status === 'pending' ? 'bg-indicator-premium/10 text-indicator-premium-border border-indicator-premium-border/20'
                        : inv.status === 'accepted' ? 'bg-status-success-bg text-indicator-online border-indicator-online/20'
                        : inv.status === 'expired' ? 'bg-surface-sunken text-txt-tertiary border-border'
                        : 'bg-surface-sunken text-txt-tertiary border-border'
                      }`}>
                        {inv.status.toUpperCase()}
                      </span>
                    </div>

                    {inv.invitee && (
                      <p className="text-[11px] text-txt-secondary mt-1">
                        받는 사람: <span className="font-semibold">{inv.invitee.nickname || '익명'}</span>
                      </p>
                    )}

                    {inv.status === 'declined' && inv.decline_reason && (
                      <p className="text-xs text-txt-tertiary line-clamp-2 border-l border-border pl-2 mt-1">
                        거절 사유: {inv.decline_reason}
                      </p>
                    )}

                    <p className="text-[10px] font-mono text-txt-tertiary mt-1">
                      {new Date(inv.created_at).toLocaleDateString('ko-KR')}
                      {inv.expires_at && inv.status === 'pending' && (
                        <> · 만료 {new Date(inv.expires_at).toLocaleDateString('ko-KR')}</>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {inv.status === 'pending' && stale && (
                      <button
                        onClick={() => handleRemind(inv.id)}
                        disabled={remindInvitation.isPending}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold bg-amber-500 text-white hover:bg-amber-600 ob-press-spring rounded"
                        title="24시간 이상 응답 없음 — 리마인더 알림 재전송"
                      >
                        <Bell size={11} /> 리마인더
                      </button>
                    )}
                    {inv.status === 'pending' && (
                      <button
                        onClick={() => setCancelTarget(inv.id)}
                        disabled={cancelInvitation.isPending}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold border border-border text-txt-secondary hover:bg-surface-sunken ob-press-spring rounded"
                      >
                        <X size={11} /> 취소
                      </button>
                    )}
                    {(inv.status === 'declined' || inv.status === 'expired') && (
                      <button
                        onClick={() => handleResend(inv)}
                        disabled={createInvitation.isPending}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold border border-brand text-brand hover:bg-brand-bg ob-press-spring rounded"
                      >
                        <RotateCw size={11} /> 재발송
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={Send}
          title="아직 보낸 초대가 없습니다"
          description="관심 있는 사람을 찾아 프로젝트로 초대해보세요"
          actionLabel="사람 둘러보기"
          actionHref="/explore?scope=people"
          size="compact"
        />
      )}

      <ConfirmModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={async () => {
          if (!cancelTarget) return
          await handleCancel(cancelTarget)
          setCancelTarget(null)
        }}
        title="초대 취소"
        message="이 초대를 취소합니다. 받는 사람에게는 알리지 않습니다."
        confirmText="취소하기"
        cancelText="닫기"
        variant="warning"
      />
    </section>
  )
}
