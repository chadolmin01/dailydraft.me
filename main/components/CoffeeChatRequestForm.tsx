'use client'

import React, { useState } from 'react'
import { Coffee, Loader2, Bell, BellOff } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/src/context/AuthContext'
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
  const { user, profile } = useAuth()
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
        <div className="w-14 h-14 bg-status-success-bg rounded-lg border border-status-success-text/20 flex items-center justify-center mb-4 mx-auto shadow-sm success-pop">
          <Coffee size={24} className="text-status-success-text" />
        </div>
        <h3 className="text-xl font-bold text-txt-primary mb-2 animate-in fade-in">커피챗 신청 완료!</h3>
        <p className="text-txt-tertiary text-sm mb-6">
          {isPersonMode
            ? '상대방에게 알림이 전송되었습니다. 수락되면 연락처를 받을 수 있어요.'
            : '메이커에게 알림이 전송되었습니다. 수락되면 연락처를 받을 수 있어요.'}
        </p>

        {showPushPrompt && (
          <div className="mb-6 px-4 py-4 bg-surface-sunken border border-border rounded-xl text-left">
            <div className="flex items-start gap-3">
              <Bell size={16} className="text-txt-secondary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-txt-primary mb-0.5">답장 오면 알려드릴게요</p>
                <p className="text-xs text-txt-tertiary mb-3">수락/거절 알림을 브라우저로 바로 받아보세요.</p>
                <div className="flex gap-2">
                  <button
                    onClick={subscribe}
                    disabled={pushLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-inverse text-txt-inverse text-xs font-bold hover:opacity-80 transition-opacity disabled:opacity-40"
                  >
                    {pushLoading ? <Loader2 size={12} className="animate-spin" /> : <Bell size={12} />}
                    알림 허용
                  </button>
                  <button
                    onClick={() => { setSent(false); setMessage(''); onClose() }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-txt-disabled hover:text-txt-secondary transition-colors"
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
            className="text-sm text-txt-disabled hover:text-txt-secondary transition-colors"
          >
            돌아가기
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="text-center py-4">
      <Coffee size={28} className="text-txt-primary mb-4 mx-auto" />
      <h3 className="text-lg font-bold text-txt-primary mb-1">
        {isPersonMode ? '커피챗 신청' : '커피챗 신청'}
      </h3>
      {selectedRole && (
        <span className="inline-block px-2.5 py-1 bg-surface-sunken text-txt-secondary text-xs font-medium border border-border mb-2">
          {selectedRole} 포지션
        </span>
      )}
      <p className="text-txt-tertiary text-xs mb-5">
        {isPersonMode ? '상대방에게 보낼 메시지를 작성해주세요' : '메이커에게 보낼 메시지를 작성해주세요'}
      </p>

      {/* Template buttons */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => setMessage(tpl.message)}
            className="text-xs px-3 py-1.5 bg-surface-sunken text-txt-secondary border border-border rounded-lg hover:bg-black hover:text-white hover:border-border transition-colors"
          >
            {tpl.label}
          </button>
        ))}
      </div>

      {profile && !profile.ai_chat_completed && (
        <p className="text-[11px] text-brand mb-2 text-left">
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
        className="w-full px-4 py-3 border border-border text-base sm:text-sm text-left bg-surface-card rounded-xl focus:outline-none focus:border-brand resize-none"
      />
      <div className="text-[10px] text-txt-tertiary font-mono text-right mt-1 mb-4">
        {message.length}/500
      </div>

      {error && (
        <p className="text-xs text-status-danger-text mb-3">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!message.trim() || isPending}
        className="w-full bg-brand text-white border border-brand py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-brand-hover hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed mb-3"
      >
        {isPending ? (
          <><Loader2 size={14} className="animate-spin" /> 전송 중...</>
        ) : (
          <><Coffee size={14} /> 신청하기</>
        )}
      </button>

      <button
        onClick={onClose}
        className="text-sm text-txt-disabled hover:text-txt-secondary transition-colors"
      >
        돌아가기
      </button>
    </div>
  )
}
