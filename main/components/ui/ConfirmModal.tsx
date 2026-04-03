'use client'

import React from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from './Button'
import { Modal } from './Modal'

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

  const variantStyles = {
    danger: {
      icon: 'bg-status-danger-bg text-status-danger-text',
      confirmVariant: 'danger' as const,
    },
    warning: {
      icon: 'bg-status-warning-bg text-status-warning-text',
      confirmVariant: 'danger' as const,
    },
    info: {
      icon: 'bg-status-info-bg text-status-info-text',
      confirmVariant: 'blue' as const,
    },
  }

  const styles = variantStyles[variant]

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" showClose={false} className="bg-surface-card">
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
          <Button
            variant={styles.confirmVariant}
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
            loading={isLoading}
            fullWidth
          >
            {isLoading ? '처리 중...' : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmModal
