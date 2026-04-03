'use client'

import React from 'react'
import { AlertTriangle, AlertCircle, RefreshCw, ServerCrash } from 'lucide-react'
import { Button } from './Button'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
  size?: 'compact' | 'default'
  variant?: 'inline'
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message = '일시적인 오류가 발생했습니다. 잠시 �� 다시 시도해주세요.',
  onRetry,
  className = '',
  size = 'default',
  variant,
}) => {
  const defaultTitle = size === 'compact' ? '데이터를 불러오는 데 실패했습니다' : '데이터를 불러올 수 없습니다'
  const displayTitle = title ?? defaultTitle

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 text-status-danger-text ${className}`}>
        <AlertCircle size={16} />
        <span className="text-sm">{displayTitle}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm font-medium underline hover:no-underline"
          >
            다시 ���도
          </button>
        )}
      </div>
    )
  }

  const isCompact = size === 'compact'

  if (isCompact) {
    return (
      <div className={`flex flex-col items-center justify-center py-8 text-center ${className}`}>
        <div className="w-10 h-10 bg-status-danger-text/10 border border-status-danger-text/20 flex items-center justify-center mb-2">
          <AlertTriangle size={20} className="text-status-danger-text" />
        </div>
        <p className="text-xs font-medium text-txt-secondary mb-1">{displayTitle}</p>
        <p className="text-xs text-txt-tertiary mb-3">{message}</p>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            <RefreshCw size={12} />
            다시 시도
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      <div className="w-14 h-14 bg-status-danger-text/10 border border-status-danger-text/20 flex items-center justify-center mb-4">
        <ServerCrash size={28} className="text-status-danger-text/70" />
      </div>
      <h3 className="text-lg font-bold text-txt-primary mb-2">{displayTitle}</h3>
      <p className="text-sm text-txt-tertiary max-w-sm mb-6">{message}</p>
      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          <RefreshCw size={16} />
          다시 시도
        </Button>
      )}
    </div>
  )
}

export default ErrorState
