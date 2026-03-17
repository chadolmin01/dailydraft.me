'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
  size?: 'compact' | 'default'
  className?: string
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = '데이터를 불러오는 데 실패했습니다',
  onRetry,
  size = 'default',
  className = '',
}) => {
  const isCompact = size === 'compact'

  return (
    <div className={`
      bg-surface-card border border-status-danger-text/20 text-center
      ${isCompact ? 'py-6 px-4' : 'py-12 px-6'}
      ${className}
    `}>
      <div className={`inline-flex items-center justify-center bg-status-danger-text/10 border border-status-danger-text/20 ${isCompact ? 'w-10 h-10 mb-2' : 'w-14 h-14 mb-4'}`}>
        <AlertTriangle size={isCompact ? 20 : 24} className="text-status-danger-text" />
      </div>

      <p className={`font-medium text-txt-secondary ${isCompact ? 'text-xs mb-1' : 'text-sm mb-1.5'}`}>
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className={`
            inline-flex items-center gap-1.5 font-bold text-txt-secondary border border-border-strong
            hover:bg-surface-sunken transition-all shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]
            ${isCompact ? 'px-3 py-1.5 text-xs mt-3' : 'px-4 py-2 text-sm mt-4'}
          `}
        >
          <RefreshCw size={isCompact ? 12 : 14} />
          다시 시도
        </button>
      )}
    </div>
  )
}
