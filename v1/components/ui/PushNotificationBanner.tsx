'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Loader2 } from 'lucide-react'
import { usePushNotification } from '@/src/hooks/usePushNotification'
import { useAuth } from '@/src/context/AuthContext'

export function PushNotificationBanner() {
  const { isAuthenticated } = useAuth()
  const { permission, isSubscribed, isLoading, subscribe } = usePushNotification()
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    setDismissed(!!localStorage.getItem('push-banner-dismissed'))
  }, [])

  const handleDismiss = () => {
    localStorage.setItem('push-banner-dismissed', '1')
    setDismissed(true)
  }

  const handleSubscribe = async () => {
    const ok = await subscribe()
    if (ok) handleDismiss()
  }

  if (!isAuthenticated || permission === 'unsupported' || permission === 'granted' || isSubscribed || dismissed) {
    return null
  }

  return (
    <div className="mb-4 flex items-start gap-3 px-4 py-3 bg-surface-card rounded-xl shadow-sm">
      <div className="w-8 h-8 rounded-lg bg-surface-sunken border border-border flex items-center justify-center shrink-0">
        <Bell size={14} className="text-txt-secondary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-txt-primary mb-0.5">이 기기에서 알림 받기</p>
        <p className="text-xs text-txt-tertiary break-keep leading-relaxed">
          커피챗 수락·지원 결과·초대를 바로 받아 보실 수 있습니다. 원하시면 언제든 다시 꺼 두실 수 있습니다.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleSubscribe}
          disabled={isLoading}
          aria-label="알림 구독 허용"
          title="브라우저 푸시 권한을 요청합니다"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-inverse text-txt-inverse text-xs font-bold hover:opacity-80 transition-opacity disabled:opacity-40"
        >
          {isLoading ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <Bell size={12} aria-hidden="true" />}
          허용
        </button>
        <button
          onClick={handleDismiss}
          className="text-txt-disabled hover:text-txt-secondary transition-colors p-1"
          aria-label="이 배너 닫기 · 다시 표시되지 않습니다"
          title="이 배너 닫기 (다음에 표시되지 않습니다)"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
