'use client'

import { useEffect, useState } from 'react'
import { WifiOff, Wifi } from 'lucide-react'
import { useOnlineStatus } from '@/src/hooks/useOnlineStatus'

/**
 * OfflineBanner — 온보딩 화면 상단에 고정되는 네트워크 상태 배너.
 *
 * 동작:
 *   - 오프라인 시: "인터넷 연결이 끊겼습니다. 입력하신 내용은 기기에 저장됩니다"
 *   - 복구 직후 3초간: "연결이 복구되었습니다" (부드럽게 사라짐)
 *   - 항상 온라인이면 null
 *
 * prefers-reduced-motion 을 존중해 트랜지션 생략 가능.
 */
export function OfflineBanner() {
  const { isOnline, wasOffline } = useOnlineStatus()
  const [showRecovered, setShowRecovered] = useState(false)

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowRecovered(true)
      const t = setTimeout(() => setShowRecovered(false), 3000)
      return () => clearTimeout(t)
    }
  }, [isOnline, wasOffline])

  if (isOnline && !showRecovered) return null

  if (!isOnline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed top-0 inset-x-0 z-tooltip bg-status-warn-bg text-status-warn-text border-b border-status-warn-text/30 shadow-sm"
      >
        <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center gap-2 text-[12px]">
          <WifiOff size={14} className="shrink-0" aria-hidden="true" />
          <p className="flex-1 leading-tight">
            <strong className="font-bold">인터넷 연결이 끊겼습니다.</strong>{' '}
            <span className="opacity-80">입력하신 내용은 기기에 저장되어 있어 연결이 돌아오면 이어서 진행하실 수 있습니다.</span>
          </p>
        </div>
      </div>
    )
  }

  // Recovered
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 inset-x-0 z-tooltip bg-brand-bg text-brand border-b border-brand/30 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <div className="max-w-2xl mx-auto px-4 py-2 flex items-center gap-2 text-[12px]">
        <Wifi size={14} className="shrink-0" aria-hidden="true" />
        <p className="flex-1 leading-tight font-medium">연결이 복구되었습니다.</p>
      </div>
    </div>
  )
}
