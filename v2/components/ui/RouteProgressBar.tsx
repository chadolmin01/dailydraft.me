'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useIsFetching, useIsMutating } from '@tanstack/react-query'

/**
 * 상단 얇은 프로그레스 바 — 다음 3가지 상태 중 하나라도 진행 중이면 표시:
 *
 *   1) Route navigation (pathname 변경) — 500ms 자동 hide
 *   2) React Query fetching (useIsFetching > 0) — 쿼리 끝날 때까지 표시
 *   3) React Query mutation (useIsMutating > 0) — mutation 끝날 때까지 표시
 *
 * 즉 탭 전환·검색·필터·카테고리·"더보기"·정렬 같은 queryKey 변경이나
 * 백그라운드 refetch·optimistic update 모두 사용자에게 작은 진행 힌트로 통합 노출.
 *
 * staleTime 내 캐시 히트(=즉시 완료) 는 fetching 카운트가 안 오르므로 표시 안 됨 —
 * 원래 빠른 전환은 여전히 깜빡임 없음.
 *
 * 100ms 지연을 두어 너무 짧은 fetch 에서는 아예 안 보이게(깜빡임 제거).
 */
export function RouteProgressBar() {
  const pathname = usePathname()
  const prevPathRef = useRef(pathname)

  const fetchingCount = useIsFetching()
  const mutatingCount = useIsMutating()
  const anyAsyncInFlight = fetchingCount > 0 || mutatingCount > 0

  // route 전환 기준 타이머
  const [routeBusy, setRouteBusy] = useState(false)
  // 비동기 진행 상태 — 100ms 디바운스로 깜빡임 제거
  const [asyncBusy, setAsyncBusy] = useState(false)

  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      prevPathRef.current = pathname
      setRouteBusy(true)
      const timer = setTimeout(() => setRouteBusy(false), 500)
      return () => clearTimeout(timer)
    }
  }, [pathname])

  useEffect(() => {
    if (anyAsyncInFlight) {
      // 100ms 안에 끝나는 쿼리(캐시 hit 등)는 아예 표시 안 함 — 깜빡임 방지
      const timer = setTimeout(() => setAsyncBusy(true), 100)
      return () => clearTimeout(timer)
    }
    // 진행 끝나면 즉시 숨김
    setAsyncBusy(false)
  }, [anyAsyncInFlight])

  const visible = routeBusy || asyncBusy
  if (!visible) return null

  return <div className="route-progress-bar" aria-hidden="true" />
}
