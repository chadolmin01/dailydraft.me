'use client'

import React, { useState, useEffect } from 'react'
import { Heart, Loader2, X } from 'lucide-react'
import { useInterests } from '@/src/hooks/useInterests'

interface InterestButtonProps {
  opportunityId: string
  initialCount?: number
  className?: string
}

export const InterestButton: React.FC<InterestButtonProps> = ({
  opportunityId,
  initialCount = 0,
  className = '',
}) => {
  const { loading, expressInterest, checkInterest } = useInterests({ opportunityId })

  const [count, setCount] = useState(initialCount)
  const [hasInterest, setHasInterest] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Check if user has already expressed interest
  useEffect(() => {
    const savedEmail = sessionStorage.getItem('user_email_interest')
    if (savedEmail) {
      setEmail(savedEmail)
      checkInterest(savedEmail).then(setHasInterest)
    }
  }, [opportunityId, checkInterest])

  const handleClick = () => {
    if (hasInterest) return

    const savedEmail = sessionStorage.getItem('user_email_interest')
    if (savedEmail) {
      handleSubmit(savedEmail)
    } else {
      setShowModal(true)
    }
  }

  const handleSubmit = async (emailToUse?: string) => {
    const finalEmail = emailToUse || email.trim()

    if (!finalEmail) {
      setError('이메일을 입력해주세요')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(finalEmail)) {
      setError('올바른 이메일 형식을 입력해주세요')
      return
    }

    setSubmitting(true)
    setError('')

    const success = await expressInterest(finalEmail)

    if (success) {
      sessionStorage.setItem('user_email_interest', finalEmail)
      setHasInterest(true)
      setCount((prev) => prev + 1)
      setShowModal(false)
    } else {
      // Already interested (duplicate)
      setHasInterest(true)
      setShowModal(false)
      setError('이미 관심을 표현했습니다')
    }

    setSubmitting(false)
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading || hasInterest}
        className={`flex items-center gap-2 px-4 py-2 border transition-all ${
          hasInterest
            ? 'bg-pink-50 text-pink-600 border-pink-300 cursor-default'
            : 'bg-surface-card text-txt-secondary border-border-strong hover:border-pink-400 hover:text-pink-600'
        } ${className}`}
      >
        <Heart
          size={18}
          className={hasInterest ? 'fill-pink-500 text-pink-500' : ''}
        />
        <span className="text-sm font-bold">
          {hasInterest ? '관심 표현함' : '관심 있어요'}
        </span>
        {count > 0 && (
          <span className="text-xs font-mono bg-surface-sunken px-1.5 py-0.5 border border-border">
            {count}
          </span>
        )}
      </button>

      {/* Email Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-card shadow-brutal border border-border-strong w-full max-w-sm">
            <div className="p-4 border-b border-border-strong flex items-center justify-between">
              <h3 className="font-bold text-txt-primary">관심 표현하기</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-txt-disabled hover:text-txt-secondary"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <p className="text-sm text-txt-secondary mb-4">
                관심을 표현하시면 프로젝트 오너에게 알림이 갑니다.
              </p>

              <input
                type="email"
                placeholder="이메일을 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-border-strong bg-surface-card focus:outline-none focus:border-[#4F46E5] mb-2"
              />

              {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

              <p className="text-xs text-txt-disabled mb-4">
                * 이메일은 프로젝트 오너에게만 공개됩니다
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-border-strong text-txt-secondary hover:bg-black hover:text-white text-sm font-bold transition-all"
                >
                  취소
                </button>
                <button
                  onClick={() => handleSubmit()}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-[#4F46E5] text-white border border-[#4F46E5] hover:bg-[#4338CA] text-sm font-bold shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Heart size={16} />
                      관심 표현
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
