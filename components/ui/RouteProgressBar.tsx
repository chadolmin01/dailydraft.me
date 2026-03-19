'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

/**
 * 페이지 이동 시 상단에 얇은 프로그레스 바를 표시합니다.
 * pathname이 바뀌면 잠시 표시 후 사라집니다.
 */
export function RouteProgressBar() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const prevPathRef = useRef(pathname)

  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      prevPathRef.current = pathname
      setVisible(true)
      const timer = setTimeout(() => setVisible(false), 500)
      return () => clearTimeout(timer)
    }
  }, [pathname])

  if (!visible) return null

  return <div className="route-progress-bar" />
}
