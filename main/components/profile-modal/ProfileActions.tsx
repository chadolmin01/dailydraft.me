import { Coffee, UserPlus } from 'lucide-react'
import { useCoffeeChats } from '@/src/hooks/useCoffeeChats'
import { CoffeeChatRequestForm } from '../CoffeeChatRequestForm'
import { InviteToProjectModal } from '../InviteToProjectModal'

export function ProfileActions({
  targetUserId,
  targetName,
  showCoffeeChatForm,
  setShowCoffeeChatForm,
  showInviteModal,
  setShowInviteModal,
  initialMessage,
}: {
  targetUserId: string
  targetName: string
  showCoffeeChatForm: boolean
  setShowCoffeeChatForm: (v: boolean) => void
  showInviteModal: boolean
  setShowInviteModal: (v: boolean) => void
  initialMessage?: string
}) {
  const { data: existingChats = [] } = useCoffeeChats({
    targetUserId,
    enabled: !!targetUserId,
  })
  const pendingChat = existingChats.find(c => c.status === 'pending')
  const latestChat = existingChats[0]

  return (
    <>
      <div className="border-t border-border mt-4 pt-4">
        <div className="flex gap-2">
          {/* Coffee Chat Button */}
          {pendingChat ? (
            <div className="flex-1 flex items-center justify-center gap-1.5 px-3 h-10 bg-status-warning-bg text-status-warning-text text-xs font-bold rounded-lg border border-status-warning-text/20">
              <Coffee size={14} />
              커피챗 대기 중
            </div>
          ) : latestChat?.status === 'accepted' ? (
            <div className="flex-1 flex items-center justify-center gap-1.5 px-3 h-10 bg-status-success-bg text-status-success-text text-xs font-bold rounded-lg border border-status-success-text/20">
              <Coffee size={14} />
              커피챗 수락됨
            </div>
          ) : (
            <button
              onClick={() => setShowCoffeeChatForm(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 h-10 bg-surface-card text-txt-secondary text-xs font-bold rounded-lg border border-border hover:bg-black hover:text-white hover:shadow-md active:scale-[0.97] transition-all"
            >
              <Coffee size={14} />
              커피챗 신청
            </button>
          )}

          {/* Invite to Project Button */}
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 h-10 bg-surface-card text-txt-secondary text-xs font-bold rounded-lg border border-border hover:bg-black hover:text-white hover:shadow-md active:scale-[0.97] transition-all"
          >
            <UserPlus size={14} />
            프로젝트에 초대
          </button>
        </div>
      </div>

      {/* Coffee Chat Form Overlay */}
      {showCoffeeChatForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-popover p-4" onClick={(e) => { e.stopPropagation(); setShowCoffeeChatForm(false) }}>
          <div className="bg-surface-card rounded-xl border border-border shadow-lg w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <CoffeeChatRequestForm
              targetUserId={targetUserId}
              onClose={() => setShowCoffeeChatForm(false)}
              initialMessage={initialMessage}
            />
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteToProjectModal
          targetUserId={targetUserId}
          targetName={targetName}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </>
  )
}
