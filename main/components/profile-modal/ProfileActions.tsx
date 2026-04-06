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
      <div className="flex gap-2.5 mt-4">
        {/* Coffee Chat Button */}
        {pendingChat ? (
          <div className="flex-1 flex items-center justify-center gap-2 px-4 h-12 bg-[#FFF8E1] dark:bg-[#3A2E1C] text-[#FF9500] text-[14px] font-semibold rounded-2xl">
            <Coffee size={16} />
            커피챗 대기 중
          </div>
        ) : latestChat?.status === 'accepted' ? (
          <div className="flex-1 flex items-center justify-center gap-2 px-4 h-12 bg-[#E8F5E9] dark:bg-[#1B3A2D] text-[#34C759] text-[14px] font-semibold rounded-2xl">
            <Coffee size={16} />
            커피챗 수락됨
          </div>
        ) : (
          <button
            onClick={() => setShowCoffeeChatForm(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 h-12 bg-[#3182F6] text-white text-[14px] font-semibold rounded-2xl hover:bg-[#2272EB] active:scale-[0.97] transition-all"
          >
            <Coffee size={16} />
            커피챗 신청
          </button>
        )}

        {/* Invite to Project Button */}
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex-1 flex items-center justify-center gap-2 px-4 h-12 bg-[#F2F3F5] dark:bg-[#2C2C2E] text-txt-primary text-[14px] font-semibold rounded-2xl hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C] active:scale-[0.97] transition-all"
        >
          <UserPlus size={16} />
          프로젝트에 초대
        </button>
      </div>

      {/* Coffee Chat Form Overlay */}
      {showCoffeeChatForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-popover p-4" onClick={(e) => { e.stopPropagation(); setShowCoffeeChatForm(false) }}>
          <div className="bg-surface-card dark:bg-[#1C1C1E] rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
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
