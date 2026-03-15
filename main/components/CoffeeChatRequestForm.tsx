'use client'

import React, { useState } from 'react'
import { Coffee, Loader2 } from 'lucide-react'
import { useAuth } from '@/src/context/AuthContext'
import { useRequestCoffeeChat } from '@/src/hooks/useCoffeeChats'
import { COFFEE_CHAT_TEMPLATES } from '@/src/lib/constants/coffee-chat-templates'

interface CoffeeChatRequestFormProps {
  opportunityId: string
  onClose: () => void
}

export const CoffeeChatRequestForm: React.FC<CoffeeChatRequestFormProps> = ({
  opportunityId,
  onClose,
}) => {
  const { user } = useAuth()
  const requestChat = useRequestCoffeeChat()
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(false)

  const handleSubmit = async () => {
    if (!message.trim() || !user?.email) return
    setError(false)
    try {
      await requestChat.mutateAsync({
        opportunityId,
        email: user.email,
        name: user.user_metadata?.full_name || user.email.split('@')[0],
        message: message.trim(),
      })
      setSent(true)
    } catch {
      setError(true)
    }
  }

  if (sent) {
    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-4 mx-auto">
          <Coffee size={24} className="text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">커피챗 신청 완료!</h3>
        <p className="text-gray-500 text-sm mb-6">메이커에게 알림이 전송되었습니다. 수락되면 연락처를 받을 수 있어요.</p>
        <button
          onClick={() => { setSent(false); setMessage(''); onClose() }}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          돌아가기
        </button>
      </div>
    )
  }

  return (
    <div className="text-center py-4">
      <Coffee size={28} className="text-gray-900 mb-4 mx-auto" />
      <h3 className="text-lg font-bold text-gray-900 mb-1">커피챗 신청</h3>
      <p className="text-gray-500 text-xs mb-5">메이커에게 보낼 메시지를 작성해주세요</p>

      {/* Template buttons */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {COFFEE_CHAT_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => setMessage(tpl.message)}
            className="text-[11px] px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
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
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-left focus:outline-none focus:border-black resize-none mb-4"
      />

      {error && (
        <p className="text-xs text-red-500 mb-3">전송에 실패했습니다. 다시 시도해주세요.</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!message.trim() || requestChat.isPending}
        className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3"
      >
        {requestChat.isPending ? (
          <><Loader2 size={14} className="animate-spin" /> 전송 중...</>
        ) : (
          <><Coffee size={14} /> 신청하기</>
        )}
      </button>

      <button
        onClick={onClose}
        className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        돌아가기
      </button>
    </div>
  )
}
