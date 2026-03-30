'use client'

import React, { useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from './Button'
import { useBackHandler } from '@/src/hooks/useBackHandler'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  variant = 'danger',
}) => {
  const [isLoading, setIsLoading] = React.useState(false)
  useBackHandler(isOpen, onClose)
  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // 배경 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const variantStyles = {
    danger: {
      icon: 'bg-status-danger-bg text-status-danger-text',
      button: 'bg-status-danger-text hover:bg-status-danger-text/90 text-white',
    },
    warning: {
      icon: 'bg-status-warning-bg text-status-warning-text',
      button: 'bg-status-warning-text hover:bg-status-warning-text/90 text-white',
    },
    info: {
      icon: 'bg-status-info-bg text-status-info-text',
      button: 'bg-status-info-text hover:bg-status-info-text/90 text-white',
    },
  }

  const styles = variantStyles[variant]

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface-card w-full max-w-md border border-border-strong shadow-brutal animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-4 top-4 p-1 hover:bg-surface-sunken transition-colors text-txt-tertiary hover:text-txt-primary border border-transparent hover:border-border"
        >
          <X size={18} />
        </button>

        <div className="p-6">
          {/* Icon */}
          <div className={`w-12 h-12 ${styles.icon} flex items-center justify-center mx-auto mb-4 border border-current/20`}>
            <AlertTriangle size={24} />
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-txt-primary text-center mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-sm text-txt-secondary text-center mb-6">
            {message}
          </p>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
              fullWidth
            >
              {cancelText}
            </Button>
            <button
              onClick={async () => {
                setIsLoading(true)
                try {
                  await onConfirm()
                  onClose()
                } catch {
                  // 에러는 onConfirm 내부에서 처리
                } finally {
                  setIsLoading(false)
                }
              }}
              disabled={isLoading}
              className={`flex-1 px-4 py-2.5 text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center hover:opacity-90 active:scale-[0.97] ${styles.button}`}
            >
              {isLoading ? '처리 중...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
