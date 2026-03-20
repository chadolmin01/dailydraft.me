'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

/**
 * 페이지 전환 시 fade-in 애니메이션을 적용합니다.
 * pathname이 바뀌면 잠시 투명해졌다가 새 콘텐츠가 fade-in됩니다.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const prevRef = useRef(pathname)
  const [phase, setPhase] = useState<'visible' | 'fading-out' | 'fading-in'>('visible')

  useEffect(() => {
    if (pathname !== prevRef.current) {
      prevRef.current = pathname
      // 새 페이지 콘텐츠가 이미 children에 들어온 상태 → 바로 fade-in
      setPhase('fading-in')
      const timer = setTimeout(() => setPhase('visible'), 200)
      return () => clearTimeout(timer)
    }
  }, [pathname])

  return (
    <div
      className={
        phase === 'fading-in'
          ? 'animate-page-enter'
          : phase === 'fading-out'
            ? 'opacity-0'
            : ''
      }
    >
      {children}
    </div>
  )
}
