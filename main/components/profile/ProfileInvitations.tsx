'use client'

import { Loader2, Mail } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { useProjectInvitations, useRespondToInvitation } from '@/src/hooks/useProjectInvitations'

export function ProfileInvitations() {
  const { data: receivedInvitations = [], isLoading: invitationsLoading } = useProjectInvitations({ asSender: false })
  const respondToInvitation = useRespondToInvitation()

  return (
    <section className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[0.625rem] font-medium text-txt-tertiary flex items-center gap-2">
          <span className="w-5 h-5 bg-brand text-white flex items-center justify-center text-[0.5rem] font-bold">I</span>
          RECEIVED INVITATIONS
          {receivedInvitations.filter(i => i.status === 'pending').length > 0 && (
            <span className="text-[0.625rem] font-mono font-bold bg-indicator-alert text-white px-1.5 py-0.5">
              {receivedInvitations.filter(i => i.status === 'pending').length} PENDING
            </span>
          )}
        </h3>
      </div>

      {invitationsLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-txt-tertiary" size={20} />
        </div>
      ) : receivedInvitations.length > 0 ? (
        <div className="space-y-3">
          {receivedInvitations.filter(i => i.status === 'pending').map((inv) => (
            <div key={inv.id} className="relative bg-surface-card border border-border-strong p-4 border-l-4 border-l-brand shadow-sharp">
              <div className="absolute top-1 right-1 w-2 h-2 border-r border-t border-surface-inverse/20" />
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[0.625rem] font-mono font-bold bg-brand-bg text-brand px-1.5 py-0.5 border border-brand-border">
                      {inv.role}
                    </span>
                    <span className="text-[0.625rem] font-mono font-bold bg-indicator-premium/10 text-indicator-premium-border px-1.5 py-0.5 border border-indicator-premium-border/20">PENDING</span>
                  </div>
                  {inv.message && (
                    <p className="text-xs text-txt-tertiary line-clamp-2 border-l border-dashed border-border pl-2 mt-1">{inv.message}</p>
                  )}
                  <p className="text-[0.625rem] font-mono text-txt-tertiary mt-1">
                    {new Date(inv.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={async () => {
                      try {
                        await respondToInvitation.mutateAsync({ id: inv.id, status: 'accepted' })
                      } catch { /* handled by mutation */ }
                    }}
                    disabled={respondToInvitation.isPending}
                    className="px-3 py-1.5 text-xs font-bold bg-indicator-online text-white border border-indicator-online hover:bg-indicator-online/90 hover:opacity-90 active:scale-[0.97] transition-all"
                  >
                    수락
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await respondToInvitation.mutateAsync({ id: inv.id, status: 'declined' })
                      } catch { /* handled by mutation */ }
                    }}
                    disabled={respondToInvitation.isPending}
                    className="px-3 py-1.5 text-xs font-bold border border-border-strong text-txt-secondary hover:bg-surface-sunken shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    거절
                  </button>
                </div>
              </div>
            </div>
          ))}

          {receivedInvitations.filter(i => i.status !== 'pending').map((inv) => (
            <div key={inv.id} className="bg-surface-card border border-border-strong p-4 hover:shadow-sharp transition-all">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.625rem] font-mono font-bold bg-brand-bg text-brand px-1.5 py-0.5 border border-brand-border">
                      {inv.role}
                    </span>
                    <span className={`text-[0.625rem] font-mono font-bold px-1.5 py-0.5 border ${
                      inv.status === 'accepted' ? 'bg-status-success-bg text-indicator-online border-indicator-online/20' : 'bg-surface-sunken text-txt-tertiary border-border'
                    }`}>
                      {inv.status === 'accepted' ? 'ACCEPTED' : 'DECLINED'}
                    </span>
                  </div>
                  <p className="text-[0.625rem] font-mono text-txt-tertiary mt-0.5">
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
    </section>
  )
}
