'use client'

import React, { useState } from 'react'
import { Coffee, Loader2, Bell, BellOff } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/src/context/AuthContext'
import { useProfile } from '@/src/hooks/useProfile'
import { useRequestCoffeeChat, useRequestPersonCoffeeChat } from '@/src/hooks/useCoffeeChats'
import { COFFEE_CHAT_TEMPLATES, PERSON_COFFEE_CHAT_TEMPLATES } from '@/src/lib/constants/coffee-chat-templates'
import { usePushNotification } from '@/src/hooks/usePushNotification'

interface CoffeeChatRequestFormProps {
  opportunityId?: string
  targetUserId?: string
  onClose: () => void
  selectedRole?: string
  initialMessage?: string
}

export const CoffeeChatRequestForm: React.FC<CoffeeChatRequestFormProps> = ({
  opportunityId,
  targetUserId,
  onClose,
  selectedRole,
  initialMessage,
}) => {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const requestChat = useRequestCoffeeChat()
  const requestPersonChat = useRequestPersonCoffeeChat()
  const isPersonMode = !!targetUserId && !opportunityId
  const { permission, isSubscribed, isLoading: pushLoading, subscribe } = usePushNotification()

  const templates = isPersonMode ? PERSON_COFFEE_CHAT_TEMPLATES : COFFEE_CHAT_TEMPLATES
  const [message, setMessage] = useState(
    initialMessage ||
    (selectedRole
      ? `안녕하세요! ${selectedRole} 포지션에 관심이 있어 연락드립니다. 제 경험과 스킬이 팀에 도움이 될 수 있을 것 같아요.`
      : '')
  )
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPending = isPersonMode ? requestPersonChat.isPending : requestChat.isPending

  const handleSubmit = async () => {
    if (!message.trim() || !user?.email) return
    setError(null)
    try {
      const name = profile?.nickname || user.email.split('@')[0]
      if (isPersonMode && targetUserId) {
        await requestPersonChat.mutateAsync({
          targetUserId,
          email: user.email,
          name,
          message: message.trim(),
        })
      } else if (opportunityId) {
        await requestChat.mutateAsync({
          opportunityId,
          email: user.email,
          name,
          message: message.trim(),
        })
      }
      setSent(true)
      toast.success('커피챗이 신청되었습니다')
    } catch (err) {
      const msg = err instanceof Error ? err.message : null
      setError(msg && msg !== 'Unknown error' ? msg : '전송에 실패했습니다. 다시 시도해주세요.')
      toast.error('커피챗 신청에 실패했습니다')
    }
  }

  if (sent) {
    const showPushPrompt = permission !== 'unsupported' && permission !== 'granted' && !isSubscribed

    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 bg-[#E8F5E9] dark:bg-[#1B3A2D] rounded-2xl flex items-center justify-center mb-4 mx-auto">
          <Coffee size={24} className="text-[#34C759]" />
        </div>
        <h3 className="text-[20px] font-bold text-txt-primary mb-2">커피챗 신청 완료!</h3>
        <p className="text-[14px] text-txt-tertiary mb-6">
          {isPersonMode
            ? '상대방에게 알림이 전송되었습니다. 수락되면 연락처를 받을 수 있어요.'
            : '메이커에게 알림이 전송되었습니다. 수락되면 연락처를 받을 수 있어요.'}
        </p>

        {showPushPrompt && (
          <div className="mb-6 px-4 py-4 bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl text-left">
            <div className="flex items-start gap-3">
              <Bell size={16} className="text-[#5E6AD2] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-txt-primary mb-0.5">답장 오면 알려드릴게요</p>
                <p className="text-[12px] text-txt-tertiary mb-3">수락/거절 알림을 브라우저로 바로 받아보세요.</p>
                <div className="flex gap-2">
                  <button
                    onClick={subscribe}
                    disabled={pushLoading}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#5E6AD2] text-white text-[13px] font-semibold rounded-xl hover:bg-[#4B4FB8] transition-colors disabled:opacity-40"
                  >
                    {pushLoading ? <Loader2 size={12} className="animate-spin" /> : <Bell size={12} />}
                    알림 허용
                  </button>
                  <button
                    onClick={() => { setSent(false); setMessage(''); onClose() }}
                    className="flex items-center gap-1.5 px-4 py-2 text-[13px] text-txt-tertiary hover:text-txt-secondary transition-colors"
                  >
                    <BellOff size={12} />
                    괜찮아요
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {(!showPushPrompt || isSubscribed) && (
          <button
            onClick={() => { setSent(false); setMessage(''); onClose() }}
            className="text-[14px] text-txt-tertiary hover:text-txt-secondary transition-colors"
          >
            돌아가기
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="text-center py-4">
      <div className="w-12 h-12 bg-[#EBF4FF] dark:bg-[#1A2A42] rounded-2xl flex items-center justify-center mb-4 mx-auto">
        <Coffee size={22} className="text-[#5E6AD2]" />
      </div>
      <h3 className="text-[18px] font-bold text-txt-primary mb-1">
        커피챗 신청
      </h3>
      {selectedRole && (
        <span className="inline-block px-3 py-1 bg-[#F2F3F5] dark:bg-[#2C2C2E] text-txt-secondary text-[12px] font-semibold rounded-full mb-2">
          {selectedRole} 포지션
        </span>
      )}
      <p className="text-[13px] text-txt-tertiary mb-5">
        {isPersonMode ? '상대방에게 보낼 메시지를 작성해주세요' : '메이커에게 보낼 메시지를 작성해주세요'}
      </p>

      {/* Template buttons */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => setMessage(tpl.message)}
            className="text-[12px] px-3 py-1.5 bg-[#F2F3F5] dark:bg-[#2C2C2E] text-txt-secondary rounded-full hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C] transition-colors"
          >
            {tpl.label}
          </button>
        ))}
      </div>

      {profile && !profile.ai_chat_completed && (
        <p className="text-[11px] text-[#5E6AD2] mb-2 text-left">
          AI 매칭 분석을 완료하면 수락률이 올라가요
        </p>
      )}

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={isPersonMode
          ? '안녕하세요! 프로필을 보고 연락드립니다...'
          : '안녕하세요! 프로젝트에 관심이 있어서 연락드립니다...'
        }
        rows={4}
        maxLength={500}
        className="w-full px-4 py-3 text-[14px] text-left bg-[#F7F8F9] dark:bg-[#2C2C2E] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/20 resize-none"
      />
      <div className="text-[12px] text-txt-tertiary text-right mt-1.5 mb-4">
        {message.length}/500
      </div>

      {error && (
        <p className="text-[12px] text-[#FF3B30] mb-3">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!message.trim() || isPending}
        className="w-full h-14 bg-[#5E6AD2] text-white rounded-2xl font-semibold text-[15px] flex items-center justify-center gap-2 hover:bg-[#4B4FB8] active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed mb-3"
      >
        {isPending ? (
          <><Loader2 size={16} className="animate-spin" /> 전송 중...</>
        ) : (
          <><Coffee size={16} /> 신청하기</>
        )}
      </button>

      <button
        onClick={onClose}
        className="text-[14px] text-txt-tertiary hover:text-txt-secondary transition-colors"
      >
        돌아가기
      </button>
    </div>
  )
}
