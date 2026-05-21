'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

/**
 * View Transitions API 래퍼 — Chrome/Edge 에서 router.push 에 browser-native
 * crossfade 를 자동 입힘. Safari/Firefox 는 바로 네비게이션 (fallback).
 *
 * 사용:
 *   const navigate = useViewTransitionNav()
 *   <button onClick={() => navigate('/clubs/foo')}>Go</button>
 *
 * 적용 우선순위:
 *   1. document.startViewTransition 있으면 → crossfade 시작
 *   2. 없으면 → router.push 직접 호출
 *
 * Note: globals.css 의 ::view-transition-old/new 가 240ms 페이드 타임 지정.
 * Next 의 Suspense/loading.tsx 와 자연스럽게 결합 — 새 페이지가 로드되는
 * 동안 browser 가 이전 페이지 스크린샷을 보여주고 새 페이지로 페이드.
 */
type StartViewTransitionFn = (cb: () => void) => { finished: Promise<void> }

export function useViewTransitionNav() {
  const router = useRouter()

  return useCallback(
    (href: string) => {
      if (typeof document === 'undefined') {
        router.push(href)
        return
      }
      const doc = document as Document & { startViewTransition?: StartViewTransitionFn }
      if (doc.startViewTransition) {
        doc.startViewTransition(() => {
          router.push(href)
        })
      } else {
        router.push(href)
      }
    },
    [router]
  )
}
