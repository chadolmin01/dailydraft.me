'use client'

import { useState } from 'react'
import { Mail } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonFeed } from '@/components/ui/Skeleton'
import { useProjectInvitations, useRespondToInvitation } from '@/src/hooks/useProjectInvitations'
import { ProjectDetailModal } from '@/components/ProjectDetailModal'
import { ProfileDetailModal } from '@/components/ProfileDetailModal'

const PROJECT_TYPE_LABELS: Record<string, string> = {
  startup: '창업',
  study: '스터디',
  build: '만들기',
  project: '프로젝트',
}

export function ProfileInvitations() {
  const { data: receivedInvitations = [], isLoading: invitationsLoading } = useProjectInvitations({ asSender: false })
  const respondToInvitation = useRespondToInvitation()

  // 카드에서 모달 진입 — 받는 사람이 정보 부족 상태로 결정 안 하도록 미리보기 제공
  const [openProjectId, setOpenProjectId] = useState<string | null>(null)
  const [openInviterId, setOpenInviterId] = useState<string | null>(null)
  // 거절 사유 입력 — 거절 버튼 누르면 사유 textarea가 카드 안에 펼쳐짐 (선택)
  const [decliningId, setDecliningId] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState('')

  const handleAccept = async (id: string) => {
    try {
      const result = await respondToInvitation.mutateAsync({ id, status: 'accepted' })
      toast.success('초대를 수락했습니다')
      // 수락 직후 다음 단계 — 프로젝트 상세 모달 자동 진입 (DM은 서버에서 자동 시드됨)
      const nextProjectId = result?.next?.projectId as string | undefined
      if (nextProjectId) {
        setOpenProjectId(nextProjectId)
      }
    } catch {
      toast.error('초대 수락에 실패했습니다')
    }
  }

  const handleDecline = async (id: string) => {
    try {
      await respondToInvitation.mutateAsync({
        id,
        status: 'declined',
        decline_reason: declineReason.trim() || undefined,
      })
      toast.success('초대를 거절했습니다')
      setDecliningId(null)
      setDeclineReason('')
    } catch {
      toast.error('초대 거절에 실패했습니다')
    }
  }

  return (
    <section className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[10px] font-medium text-txt-tertiary flex items-center gap-2">
          <span className="w-5 h-5 bg-brand text-white flex items-center justify-center text-[0.5rem] font-bold">I</span>
          RECEIVED INVITATIONS
          {receivedInvitations.filter(i => i.status === 'pending').length > 0 && (
            <span className="text-[10px] font-mono font-bold bg-indicator-alert text-white px-1.5 py-0.5">
              {receivedInvitations.filter(i => i.status === 'pending').length} PENDING
            </span>
          )}
        </h3>
      </div>

      {invitationsLoading ? (
        <SkeletonFeed count={2} />
      ) : receivedInvitations.length > 0 ? (
        <div className="space-y-3">
          {receivedInvitations.filter(i => i.status === 'pending').map((inv) => {
            const opp = inv.opportunity
            const tags = (opp?.interest_tags || []).slice(0, 3)
            const typeLabel = opp?.type ? (PROJECT_TYPE_LABELS[opp.type] || opp.type) : null

            return (
              <div key={inv.id} className="relative bg-surface-card rounded-xl border border-border p-4 border-l-4 border-l-brand shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* 프로젝트 제목 + 타입 배지 */}
                    {opp && (
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="text-sm font-bold text-txt-primary truncate">{opp.title}</h4>
                        {typeLabel && (
                          <span className="text-[10px] font-mono font-bold bg-surface-sunken text-txt-secondary px-1.5 py-0.5 border border-border">
                            {typeLabel}
                          </span>
                        )}
                      </div>
                    )}

                    {/* role + status + match score */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-mono font-bold bg-brand-bg text-brand px-1.5 py-0.5 border border-brand-border">
                        {inv.role}
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-indicator-premium/10 text-indicator-premium-border px-1.5 py-0.5 border border-indicator-premium-border/20">PENDING</span>
                      {inv.match && (
                        <span
                          className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 px-1.5 py-0.5 border border-emerald-200 dark:border-emerald-800/40"
                          title={inv.match.reason}
                        >
                          MATCH {Math.round(inv.match.score)}%
                        </span>
                      )}
                    </div>

                    {/* interest tags */}
                    {tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {tags.map(t => (
                          <span key={t} className="text-[10px] text-txt-tertiary bg-surface-sunken px-1.5 py-0.5 rounded">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* inviter */}
                    {inv.inviter && (
                      <button
                        onClick={() => setOpenInviterId(inv.inviter!.user_id)}
                        className="text-[11px] text-txt-secondary mt-2 hover:text-brand transition-colors"
                      >
                        보낸 사람: <span className="font-semibold">{inv.inviter.nickname || '익명'}</span>
                        {inv.inviter.desired_position ? ` · ${inv.inviter.desired_position}` : ''}
                      </button>
                    )}

                    {inv.message && (
                      <p className="text-xs text-txt-tertiary line-clamp-2 border-l border-border pl-2 mt-2">{inv.message}</p>
                    )}

                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-[10px] font-mono text-txt-tertiary">
                        {new Date(inv.created_at).toLocaleDateString('ko-KR')}
                      </p>
                      {opp && (
                        <button
                          onClick={() => setOpenProjectId(opp.id)}
                          className="text-[11px] text-brand font-semibold hover:underline"
                        >
                          프로젝트 자세히 보기 →
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAccept(inv.id)}
                      disabled={respondToInvitation.isPending}
                      className="px-3 py-1.5 text-xs font-bold bg-indicator-online text-white border border-indicator-online hover:bg-indicator-online/90 hover:opacity-90 active:scale-[0.97] transition-all"
                    >
                      수락
                    </button>
                    <button
                      onClick={() => {
                        if (decliningId === inv.id) {
                          handleDecline(inv.id)
                        } else {
                          setDecliningId(inv.id)
                          setDeclineReason('')
                        }
                      }}
                      disabled={respondToInvitation.isPending}
                      className="px-3 py-1.5 text-xs font-bold border border-border text-txt-secondary hover:bg-surface-sunken hover:shadow-md active:scale-[0.97] transition-all"
                    >
                      {decliningId === inv.id ? '거절 확정' : '거절'}
                    </button>
                  </div>
                </div>
                {decliningId === inv.id && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <textarea
                      value={declineReason}
                      onChange={e => setDeclineReason(e.target.value)}
                      placeholder="거절 사유 (선택) — 발신자가 다음에 더 잘 매칭할 수 있도록 도와줍니다"
                      rows={2}
                      maxLength={500}
                      className="w-full px-3 py-2 text-xs bg-surface-sunken rounded focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none"
                    />
                    <button
                      onClick={() => { setDecliningId(null); setDeclineReason('') }}
                      className="text-[10px] text-txt-tertiary hover:text-txt-secondary mt-1"
                    >
                      취소
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          {receivedInvitations.filter(i => i.status !== 'pending').map((inv) => (
            <div key={inv.id} className="bg-surface-card rounded-xl border border-border p-4 hover:shadow-md hover-spring">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-brand-bg text-brand px-1.5 py-0.5 border border-brand-border">
                      {inv.role}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 border ${
                      inv.status === 'accepted' ? 'bg-status-success-bg text-indicator-online border-indicator-online/20' : 'bg-surface-sunken text-txt-tertiary border-border'
                    }`}>
                      {inv.status === 'accepted' ? 'ACCEPTED' : inv.status === 'expired' ? 'EXPIRED' : 'DECLINED'}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-txt-tertiary mt-0.5">
                    {new Date(inv.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Mail}
          title="아직 받은 초대가 없습니다"
          description="프로필을 완성하면 프로젝트 초대를 받을 수 있어요"
          size="compact"
        />
      )}

      {openProjectId && (
        <ProjectDetailModal projectId={openProjectId} onClose={() => setOpenProjectId(null)} />
      )}
      {openInviterId && (
        <ProfileDetailModal profileId={openInviterId} byUserId onClose={() => setOpenInviterId(null)} />
      )}
    </section>
  )
}
