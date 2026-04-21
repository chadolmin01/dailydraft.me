'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

/**
 * 페이지 전환 시 부드러운 crossfade — 스켈레톤 깜빡임의 대안.
 *
 * 동작:
 *   pathname 이 바뀔 때마다 key 를 증가시켜 children 을 강제 재마운트.
 *   globals.css 의 `.animate-page-enter` 가 매번 재생되어 260ms fade-up.
 *
 * 왜 key 방식:
 *   - 기존에는 setTimeout 으로 클래스 on/off 했는데 animate-page-enter 클래스
 *     자체가 정의되지 않아 무효였음.
 *   - key 재마운트 방식은 CSS 애니메이션이 항상 새로 재생됨을 보장 → 타이머
 *     경합 없음.
 *   - children 자체는 변하지 않고 (Next router 가 교체) 래퍼 div 만 새 key 로
 *     재생성되므로 React 재조정 비용 미미.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const prevRef = useRef(pathname)
  const [transitionKey, setTransitionKey] = useState(0)

  useEffect(() => {
    if (pathname !== prevRef.current) {
      prevRef.current = pathname
      setTransitionKey((k) => k + 1)
    }
  }, [pathname])

  return (
    <div key={transitionKey} className="animate-page-enter">
      {children}
    </div>
  )
}
