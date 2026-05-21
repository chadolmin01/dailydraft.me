import { useEffect, useRef, useState, useCallback } from 'react'

interface PendingSetup {
  id: string
  discord_guild_id: string
  discord_guild_name: string | null
  selected_tone: string
}

interface PollingResult {
  /** 봇 설치가 감지된 pending setup (없으면 null) */
  detected: PendingSetup | null
  /** 폴링 중인지 여부 */
  isPolling: boolean
  /** 폴링 시작 */
  startPolling: () => void
  /** 폴링 중지 */
  stopPolling: () => void
}

/**
 * Discord 봇 설치를 폴링으로 감지하는 훅
 *
 * 5초마다 GET /api/discord/connect를 호출해서
 * pending_setups가 생기면(= 봇이 서버에 설치되어 GUILD_CREATE 발생) 감지.
 * 탭이 비활성화되면 폴링을 중지하고 다시 활성화되면 재개.
 * 최대 5분(60회) 폴링 후 자동 중단.
 */
export function useDiscordPolling(): PollingResult {
  const [detected, setDetected] = useState<PendingSetup | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countRef = useRef(0)
  const MAX_POLLS = 60

  const poll = useCallback(async () => {
    try {
      const res = await fetch('/api/discord/connect')
      if (!res.ok) return

      const data = await res.json()
      const setups: PendingSetup[] = data.pending_setups ?? []

      if (setups.length > 0) {
        setDetected(setups[0])
        stopPolling()
      }
    } catch {
      // 네트워크 에러 — 조용히 재시도
    }
  }, [])

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsPolling(false)
    countRef.current = 0
  }, [])

  const startPolling = useCallback(() => {
    if (intervalRef.current) return // 이미 폴링 중
    setIsPolling(true)
    countRef.current = 0

    // 즉시 1회 실행
    poll()

    intervalRef.current = setInterval(() => {
      countRef.current++
      if (countRef.current >= MAX_POLLS) {
        stopPolling()
        return
      }
      poll()
    }, 5000)
  }, [poll, stopPolling])

  // 탭 visibility 변경 감지: 비활성 → 중지, 활성 → 재개
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      } else if (isPolling && !intervalRef.current) {
        poll()
        intervalRef.current = setInterval(() => {
          countRef.current++
          if (countRef.current >= MAX_POLLS) {
            stopPolling()
            return
          }
          poll()
        }, 5000)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [isPolling, poll, stopPolling])

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return { detected, isPolling, startPolling, stopPolling }
}
