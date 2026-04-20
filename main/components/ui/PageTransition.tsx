'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

/**
 * 페이지 전환 시 fade-in 애니메이션을 적용합니다.
 * pathname이 바뀌면 새 콘텐츠가 fade-in 됩니다.
 *
 * 단순화: 'fading-out' phase 는 실제로 도달 불가 (pathname 변경 시점엔 이미 새 children
 * 이 있음). isAnimating boolean 으로 충분.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const prevRef = useRef(pathname)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (pathname !== prevRef.current) {
      prevRef.current = pathname
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 200)
      return () => clearTimeout(timer)
    }
  }, [pathname])

  return <div className={isAnimating ? 'animate-page-enter' : ''}>{children}</div>
}
