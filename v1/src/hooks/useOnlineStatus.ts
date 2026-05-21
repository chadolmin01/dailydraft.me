'use client'

import { useEffect, useState } from 'react'

/**
 * `useOnlineStatus` — 브라우저 네트워크 상태 감지.
 *
 * navigator.onLine 은 OS 레벨 플래그라서 "연결은 있지만 실제 서버는 못 가는 상황"
 * 은 못 잡음. 그래도 오프라인 케이스의 대다수(airplane mode, Wi-Fi 끊김)는 커버.
 *
 * 반환값:
 *   - isOnline — true/false
 *   - wasOffline — 한 번이라도 오프라인 됐는지 (UI 에서 "복구됨" 배너 표시용)
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true) // SSR 기본 true
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => {
      setIsOnline(true)
    }
    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, wasOffline }
}
