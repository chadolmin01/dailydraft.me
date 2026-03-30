'use client'

import React, { useState } from 'react'
import { X, Gift, Sparkles, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useBackHandler } from '@/src/hooks/useBackHandler'

interface InviteCodeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export const InviteCodeModal: React.FC<InviteCodeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  useBackHandler(isOpen, onClose, 'invite-code')

  const [code, setCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (value.length <= 8) {
      setCode(value)
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (code.length !== 8) {
      setError('8자리 코드를 입력해주세요')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/invite-codes/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error?.message || '코드 사용에 실패했습니다')
        return
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-surface-card shadow-brutal border border-border max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Gift size={20} className="text-brand" />
            <h2 className="text-lg font-bold text-txt-primary">초대 코드 입력</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 hover:bg-surface-sunken transition-colors disabled:opacity-50"
          >
            <X size={20} className="text-txt-disabled" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-status-success-bg border border-status-success-text/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-status-success-text" />
              </div>
              <h3 className="text-xl font-bold text-txt-primary mb-2">
                프리미엄 활성화 완료!
              </h3>
              <p className="text-txt-secondary">
                이제 모든 프리미엄 기능을 사용할 수 있습니다.
              </p>
            </div>
          ) : (
            <>
              {/* Description */}
              <div className="bg-brand-bg border border-brand p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Sparkles size={20} className="text-brand flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-brand font-medium mb-1">
                      프리미엄 초대 코드
                    </p>
                    <p className="text-sm text-txt-secondary">
                      이메일로 받은 8자리 초대 코드를 입력하면 프리미엄 기능이 활성화됩니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* Code Input */}
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-[0.625rem] font-medium text-txt-tertiary mb-2">
                    초대 코드
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={handleCodeChange}
                    placeholder="예: ABC12DEF"
                    className={`w-full px-4 py-3 text-center text-xl font-mono tracking-wider border focus:outline-none focus:border-border bg-surface-card text-txt-primary ${
                      error ? 'border-status-danger-text' : 'border-border'
                    }`}
                    disabled={isSubmitting}
                    autoFocus
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs font-mono text-txt-disabled">
                      {code.length}/8 자리
                    </span>
                    {error && (
                      <span className="flex items-center gap-1 text-xs text-status-danger-text">
                        <AlertCircle size={12} />
                        {error}
                      </span>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={code.length !== 8 || isSubmitting}
                  className="w-full py-3 bg-surface-inverse text-txt-inverse font-bold border border-surface-inverse hover:bg-surface-inverse/90 disabled:bg-surface-sunken disabled:text-txt-disabled disabled:border-border disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.97]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      확인 중...
                    </>
                  ) : (
                    '코드 사용하기'
                  )}
                </button>
              </form>

              {/* Help Text */}
              <p className="text-xs text-txt-disabled text-center mt-4">
                초대 코드가 없으신가요?{' '}
                <a
                  href="mailto:support@dailydraft.io"
                  className="text-brand hover:underline"
                >
                  문의하기
                </a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default InviteCodeModal
