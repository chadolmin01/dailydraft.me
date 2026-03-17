'use client'

import React, { useState } from 'react'
import { Coffee, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/src/context/AuthContext'
import { useRequestCoffeeChat } from '@/src/hooks/useCoffeeChats'
import { COFFEE_CHAT_TEMPLATES } from '@/src/lib/constants/coffee-chat-templates'

interface CoffeeChatRequestFormProps {
  opportunityId: string
  onClose: () => void
  selectedRole?: string
}

export const CoffeeChatRequestForm: React.FC<CoffeeChatRequestFormProps> = ({
  opportunityId,
  onClose,
  selectedRole,
}) => {
  const { user } = useAuth()
  const requestChat = useRequestCoffeeChat()
  const [message, setMessage] = useState(
    selectedRole
      ? `안녕하세요! ${selectedRole} 포지션에 관심이 있어 연락드립니다. 제 경험과 스킬이 팀에 도움이 될 수 있을 것 같아요.`
      : ''
  )
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!message.trim() || !user?.email) return
    setError(null)
    try {
      await requestChat.mutateAsync({
        opportunityId,
        email: user.email,
        name: user.user_metadata?.full_name || user.email.split('@')[0],
        message: message.trim(),
      })
      setSent(true)
      toast.success('커피챗이 신청되었습니다')
    } catch (err) {
      const msg = err instanceof Error ? err.message : null
      setError(msg && msg !== 'Unknown error' ? msg : '전송에 실패했습니다. 다시 시도해주세요.')
      toast.error('커피챗 신청에 실패했습니다')
    }
  }

  if (sent) {
    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 bg-status-success-bg rounded-sm border border-status-success-text/20 flex items-center justify-center mb-4 mx-auto shadow-solid-sm">
          <Coffee size={24} className="text-status-success-text" />
        </div>
        <h3 className="text-xl font-bold text-txt-primary mb-2">커피챗 신청 완료!</h3>
        <p className="text-txt-tertiary text-sm mb-6">메이커에게 알림이 전송되었습니다. 수락되면 연락처를 받을 수 있어요.</p>
        <button
          onClick={() => { setSent(false); setMessage(''); onClose() }}
          className="text-sm text-txt-disabled hover:text-txt-secondary transition-colors"
        >
          돌아가기
        </button>
      </div>
    )
  }

  return (
    <div className="text-center py-4">
      <Coffee size={28} className="text-txt-primary mb-4 mx-auto" />
      <h3 className="text-lg font-bold text-txt-primary mb-1">커피챗 신청</h3>
      {selectedRole && (
        <span className="inline-block px-2.5 py-1 bg-surface-sunken text-txt-secondary text-xs font-medium border border-border-strong mb-2">
          {selectedRole} 포지션
        </span>
      )}
      <p className="text-txt-tertiary text-xs mb-5">메이커에게 보낼 메시지를 작성해주세요</p>

      {/* Template buttons */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {COFFEE_CHAT_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => setMessage(tpl.message)}
            className="text-[0.6875rem] px-3 py-1.5 bg-surface-sunken text-txt-secondary border border-border rounded-sm hover:bg-black hover:text-white hover:border-border-strong transition-colors"
          >
            {tpl.label}
          </button>
        ))}
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="안녕하세요! 프로젝트에 관심이 있어서 연락드립니다..."
        rows={4}
        className="w-full px-4 py-3 border border-border-strong rounded-sm text-sm text-left bg-surface-card focus:outline-none focus:border-brand resize-none mb-4"
      />

      {error && (
        <p className="text-xs text-status-danger-text mb-3">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!message.trim() || requestChat.isPending}
        className="w-full bg-brand text-white border border-brand py-3 rounded-sm font-bold text-sm flex items-center justify-center gap-2 hover:bg-brand-hover shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-40 disabled:cursor-not-allowed mb-3"
      >
        {requestChat.isPending ? (
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
