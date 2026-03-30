'use client'

import React from 'react'
import { AlertCircle, RefreshCw, WifiOff, ServerCrash, Inbox } from 'lucide-react'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
  variant?: 'default' | 'compact' | 'inline'
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = '데이터를 불러올 수 없습니다',
  message = '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  onRetry,
  className = '',
  variant = 'default',
}) => {
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 text-status-danger-text ${className}`}>
        <AlertCircle size={16} />
        <span className="text-sm">{title}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm font-medium underline hover:no-underline"
          >
            다시 시도
          </button>
        )}
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={`flex flex-col items-center justify-center py-8 text-center ${className}`}>
        <AlertCircle size={32} className="text-status-danger-text/70 mb-3" />
        <p className="text-sm font-medium text-txt-secondary mb-1">{title}</p>
        <p className="text-xs text-txt-tertiary mb-3">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-txt-secondary border border-border hover:bg-surface-sunken transition-all hover:opacity-90 active:scale-[0.97]"
          >
            <RefreshCw size={12} />
            다시 시도
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      <div className="w-16 h-16 bg-status-danger-text/10 border border-status-danger-text/20 flex items-center justify-center mb-4">
        <ServerCrash size={32} className="text-status-danger-text/70" />
      </div>
      <h3 className="text-lg font-bold text-txt-primary mb-2">{title}</h3>
      <p className="text-sm text-txt-tertiary max-w-sm mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-black hover:bg-surface-inverse/90 transition-all hover:opacity-90 active:scale-[0.97]"
        >
          <RefreshCw size={16} />
          다시 시도
        </button>
      )}
    </div>
  )
}

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  message?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      <div className="mb-4 text-txt-disabled">
        {icon || <Inbox size={48} />}
      </div>
      <h3 className="text-sm font-medium text-txt-tertiary mb-2">{title}</h3>
      {message && <p className="text-xs text-txt-disabled mb-4 max-w-xs">{message}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-black hover:bg-surface-inverse/90 transition-all hover:opacity-90 active:scale-[0.97]"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

interface NetworkErrorProps {
  onRetry?: () => void
  className?: string
}

export const NetworkError: React.FC<NetworkErrorProps> = ({
  onRetry,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      <div className="w-16 h-16 bg-indicator-premium/10 border border-indicator-premium-border/20 flex items-center justify-center mb-4">
        <WifiOff size={32} className="text-indicator-premium" />
      </div>
      <h3 className="text-lg font-bold text-txt-primary mb-2">연결할 수 없습니다</h3>
      <p className="text-sm text-txt-tertiary max-w-sm mb-6">
        인터넷 연결을 확인하고 다시 시도해주세요.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-black hover:bg-surface-inverse/90 transition-all hover:opacity-90 active:scale-[0.97]"
        >
          <RefreshCw size={16} />
          다시 시도
        </button>
      )}
    </div>
  )
}

/**
 * 로딩/에러/빈 상태를 한번에 처리하는 래퍼
 */
interface DataStateWrapperProps {
  isLoading: boolean
  isError: boolean
  isEmpty: boolean
  onRetry?: () => void
  loadingComponent?: React.ReactNode
  errorComponent?: React.ReactNode
  emptyComponent?: React.ReactNode
  children: React.ReactNode
}

export const DataStateWrapper: React.FC<DataStateWrapperProps> = ({
  isLoading,
  isError,
  isEmpty,
  onRetry,
  loadingComponent,
  errorComponent,
  emptyComponent,
  children,
}) => {
  if (isLoading) {
    return <>{loadingComponent}</>
  }

  if (isError) {
    return <>{errorComponent || <ErrorState onRetry={onRetry} variant="compact" />}</>
  }

  if (isEmpty) {
    return <>{emptyComponent || <EmptyState title="데이터가 없습니다" />}</>
  }

  return <>{children}</>
}

export default ErrorState
