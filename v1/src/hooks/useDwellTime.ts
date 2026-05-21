'use client'

import { useEffect, useState } from 'react'

interface Options {
  /** 발화 지연 (ms). 이 시간 동안 페이지가 보이고 있으면 fire */
  thresholdMs: number
  /** 페이지 가림(visibilitychange) 시 타이머 리셋 여부 — 기본 true */
  resetOnHidden?: boolean
  /** 이미 발화 후 재계산 방지 — 한 번만 true. */
  once?: boolean
}

/**
 * `useDwellTime` — 페이지에 실제로 체류한 시간을 측정해 threshold 넘으면 true.
 *
 * - requestAnimationFrame 대신 setTimeout 기반 (배터리 영향 최소)
 * - document.visibilitychange 감지로 탭 전환·백그라운드 시 pause
 * - 페이지 언마운트 시 자동 정리
 *
 * 용도: 프로젝트 상세 30초 체류 시 MicroPrompt 팝업, Newsletter CTA 등.
 */
export function useDwellTime({ thresholdMs, resetOnHidden = true, once = true }: Options): boolean {
  const [reached, setReached] = useState(false)

  useEffect(() => {
    if (reached && once) return
    if (typeof document === 'undefined') return

    let remaining = thresholdMs
    let startedAt = performance.now()
    let timer: ReturnType<typeof setTimeout> | null = null

    const arm = () => {
      if (timer) clearTimeout(timer)
      if (document.visibilityState === 'hidden') return
      startedAt = performance.now()
      timer = setTimeout(() => {
        setReached(true)
      }, remaining)
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        if (timer) {
          clearTimeout(timer)
          timer = null
          const elapsed = performance.now() - startedAt
          if (resetOnHidden) {
            remaining = thresholdMs // 전체 리셋
          } else {
            remaining = Math.max(0, remaining - elapsed)
          }
        }
      } else {
        arm()
      }
    }

    arm()
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      if (timer) clearTimeout(timer)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thresholdMs, resetOnHidden])

  return reached
}
