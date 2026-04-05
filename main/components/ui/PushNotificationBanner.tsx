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
        <p className="text-sm font-bold text-txt-primary mb-0.5">브라우저 알림 켜기</p>
        <p className="text-xs text-txt-tertiary break-keep">
          커피챗 수락/거절 알림을 이 기기에서 바로 받아보세요.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleSubscribe}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-inverse text-txt-inverse text-xs font-bold hover:opacity-80 transition-opacity disabled:opacity-40"
        >
          {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Bell size={12} />}
          허용
        </button>
        <button onClick={handleDismiss} className="text-txt-disabled hover:text-txt-secondary transition-colors p-1">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
