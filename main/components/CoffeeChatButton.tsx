'use client'

import React, { useState, useEffect } from 'react'
import { Coffee, Loader2, X, Check, Clock } from 'lucide-react'
import { useCoffeeChats } from '@/src/hooks/useCoffeeChats'

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
  const { chats, loading: chatsLoading, requestChat } = useCoffeeChats({ opportunityId })

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

  // Load saved info from localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem('user_email_interest')
    const savedName = localStorage.getItem('user_name')
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

    const result = await requestChat({
      opportunityId,
      email: email.trim(),
      name: name.trim(),
      message: message.trim() || undefined,
    })

    if (result) {
      localStorage.setItem('user_email_interest', email.trim())
      localStorage.setItem('user_name', name.trim())
      setShowModal(false)
    } else {
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
          className={`flex items-center gap-2 px-4 py-2 rounded-sm border bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed ${className}`}
        >
          <Coffee size={18} />
          <span className="text-sm font-medium">내 프로젝트</span>
        </button>
      )
    }

    if (existingRequest) {
      const statusConfig = {
        pending: { icon: Clock, text: '대기 중', style: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
        accepted: { icon: Check, text: '수락됨', style: 'bg-green-50 text-green-700 border-green-200' },
        declined: { icon: X, text: '거절됨', style: 'bg-gray-50 text-gray-500 border-gray-200' },
      }
      const config = statusConfig[existingRequest.status]
      const StatusIcon = config.icon

      return (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-sm border ${config.style} ${className}`}>
          <StatusIcon size={18} />
          <span className="text-sm font-medium">커피챗 {config.text}</span>
          {existingRequest.status === 'accepted' && existingRequest.contact_info && (
            <span className="ml-2 text-xs bg-white px-2 py-0.5 rounded border border-green-200">
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
        className={`flex items-center gap-2 px-4 py-2 rounded-sm border transition-all bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-400 ${className}`}
      >
        <Coffee size={18} />
        <span className="text-sm font-medium">커피챗 신청하기</span>
      </button>
    )
  }

  return (
    <>
      {renderButton()}

      {/* Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Coffee size={20} className="text-amber-600" />
                커피챗 신청하기
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">
                프로젝트 오너에게 커피챗을 신청합니다. 수락되면 연락처가 공개됩니다.
              </p>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  이름 (닉네임)
                </label>
                <input
                  type="text"
                  placeholder="홍길동"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  이메일
                </label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  메시지 (선택)
                </label>
                <textarea
                  placeholder="간단한 자기소개나 관심 포인트를 적어주세요"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:border-black resize-none"
                  rows={3}
                  maxLength={300}
                />
                <div className="text-right text-xs text-gray-400 mt-1">
                  {message.length}/300
                </div>
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-sm hover:bg-gray-50 text-sm font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-sm hover:bg-amber-600 text-sm font-medium disabled:bg-gray-300 flex items-center justify-center gap-2"
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
