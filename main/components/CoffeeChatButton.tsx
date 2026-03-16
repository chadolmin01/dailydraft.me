'use client'

import React, { useState, useEffect } from 'react'
import { Coffee, Loader2, X, Check, Clock } from 'lucide-react'
import { useCoffeeChats, useRequestCoffeeChat } from '@/src/hooks/useCoffeeChats'

interface CoffeeChatButtonProps {
  opportunityId: string
  ownerId: string
  className?: string
}

export const CoffeeChatButton: React.FC<CoffeeChatButtonProps> = ({
  opportunityId,
  ownerId,
  className = '',
}) => {
  const { data: chats = [], isLoading: chatsLoading } = useCoffeeChats({ opportunityId })
  const requestChatMutation = useRequestCoffeeChat()

  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Check if user has already requested
  const existingRequest = chats.find(
    (c) => c.requester_email === email || c.requester_user_id === currentUserId
  )

  // Load saved info from sessionStorage
  useEffect(() => {
    const savedEmail = sessionStorage.getItem('user_email_interest')
    const savedName = sessionStorage.getItem('user_name')
    if (savedEmail) setEmail(savedEmail)
    if (savedName) setName(savedName)
  }, [])

  // Check if current user is the owner
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { createClient } = await import('@/src/lib/supabase/client')
        const supabase = createClient()
        const { data } = await supabase.auth.getUser()
        if (data?.user) {
          setCurrentUserId(data.user.id)
        }
      } catch (err) {
        console.error(err)
      }
    }
    checkUser()
  }, [])

  const isOwner = currentUserId === ownerId

  const handleClick = () => {
    if (isOwner) return
    if (existingRequest) return
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      setError('이름과 이메일을 입력해주세요')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('올바른 이메일 형식을 입력해주세요')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await requestChatMutation.mutateAsync({
        opportunityId,
        email: email.trim(),
        name: name.trim(),
        message: message.trim() || undefined,
      })
      sessionStorage.setItem('user_email_interest', email.trim())
      sessionStorage.setItem('user_name', name.trim())
      setShowModal(false)
    } catch {
      setError('요청에 실패했습니다. 다시 시도해주세요.')
    }

    setSubmitting(false)
  }

  // Render based on state
  const renderButton = () => {
    if (isOwner) {
      return (
        <button
          disabled
          className={`flex items-center gap-2 px-4 py-2 border bg-surface-sunken text-txt-disabled border-border cursor-not-allowed ${className}`}
        >
          <Coffee size={18} />
          <span className="text-sm font-medium">내 프로젝트</span>
        </button>
      )
    }

    if (existingRequest) {
      const statusConfig = {
        pending: { icon: Clock, text: '대기 중', style: 'bg-status-warning-bg text-status-warning-text border border-status-warning-text/30' },
        accepted: { icon: Check, text: '수락됨', style: 'bg-status-success-bg text-status-success-text border border-status-success-text/30' },
        declined: { icon: X, text: '거절됨', style: 'bg-surface-sunken text-txt-tertiary border border-border' },
      }
      const config = statusConfig[existingRequest.status]
      const StatusIcon = config.icon

      return (
        <div className={`flex items-center gap-2 px-4 py-2 ${config.style} ${className}`}>
          <StatusIcon size={18} />
          <span className="text-sm font-medium">커피챗 {config.text}</span>
          {existingRequest.status === 'accepted' && existingRequest.contact_info && (
            <span className="ml-2 text-xs bg-surface-card px-2 py-0.5 border border-status-success-text/30">
              {existingRequest.contact_info}
            </span>
          )}
        </div>
      )
    }

    return (
      <button
        onClick={handleClick}
        disabled={chatsLoading}
        className={`flex items-center gap-2 px-4 py-2 border-2 transition-all bg-surface-card text-txt-primary border-border-strong hover:bg-black hover:text-white shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] ${className}`}
      >
        <Coffee size={18} />
        <span className="text-sm font-bold">커피챗 신청하기</span>
      </button>
    )
  }

  return (
    <>
      {renderButton()}

      {/* Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-card shadow-brutal border-2 border-border-strong w-full max-w-md">
            <div className="p-4 border-b border-border-strong flex items-center justify-between">
              <h3 className="font-bold text-txt-primary flex items-center gap-2">
                <Coffee size={20} className="text-[#4F46E5]" />
                커피챗 신청하기
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-txt-disabled hover:text-txt-secondary"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-sm text-txt-secondary">
                프로젝트 오너에게 커피챗을 신청합니다. 수락되면 연락처가 공개됩니다.
              </p>

              <div>
                <label className="block text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-tertiary mb-1.5">
                  이름 (닉네임)
                </label>
                <input
                  type="text"
                  placeholder="홍길동"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-border-strong bg-surface-card focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div>
                <label className="block text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-tertiary mb-1.5">
                  이메일
                </label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-border-strong bg-surface-card focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div>
                <label className="block text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-tertiary mb-1.5">
                  메시지 (선택)
                </label>
                <textarea
                  placeholder="간단한 자기소개나 관심 포인트를 적어주세요"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-border-strong bg-surface-card focus:outline-none focus:border-[#4F46E5] resize-none"
                  rows={3}
                  maxLength={300}
                />
                <div className="text-right text-xs text-txt-disabled font-mono mt-1">
                  {message.length}/300
                </div>
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-border-strong text-txt-secondary hover:bg-black hover:text-white text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-[#4F46E5] text-white border-2 border-[#4F46E5] hover:bg-[#4338CA] text-sm font-bold shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Coffee size={16} />
                      신청하기
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
