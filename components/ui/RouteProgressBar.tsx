'use client'

import { useEffect, useState, useTransition } from 'react'
import { usePathname } from 'next/navigation'

/**
 * 페이지 이동 시 상단에 얇은 프로그레스 바를 표시합니다.
 * pathname이 바뀌면 잠시 표시 후 사라집니다.
 */
export function RouteProgressBar() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [prevPath, setPrevPath] = useState(pathname)

  useEffect(() => {
    if (pathname !== prevPath) {
      // 경로가 바뀌면 바를 보여주고 잠시 후 숨김
      setVisible(true)
      setPrevPath(pathname)
      const timer = setTimeout(() => setVisible(false), 500)
      return () => clearTimeout(timer)
    }
  }, [pathname, prevPath])

  if (!visible) return null

  return <div className="route-progress-bar" />
}
