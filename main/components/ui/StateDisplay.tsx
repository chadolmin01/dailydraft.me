'use client'

import React from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'
import { ErrorState } from './ErrorState'
import { EmptyState } from './EmptyState'
import { Button } from './Button'

/**
 * 네트워크 에러 전용 상태
 */
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
        <Button variant="primary" size="sm" onClick={onRetry}>
          <RefreshCw size={14} />
          다시 시도
        </Button>
      )}
    </div>
  )
}

/**
 * ��딩/에러/빈 상태를 한번에 처리하는 래퍼
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
    return <>{errorComponent || <ErrorState onRetry={onRetry} size="compact" />}</>
  }

  if (isEmpty) {
    return <>{emptyComponent || <EmptyState icon={WifiOff} title="데이터가 없습니다" />}</>
  }

  return <>{children}</>
}
