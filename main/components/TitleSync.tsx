'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { resolveTitle, hasDynamicSeoMetadata } from '@/src/lib/routes/titles'

/**
 * 브라우저 탭 타이틀 즉시 동기화. 루트 layout 에 한 번만 마운트.
 *
 * 왜 필요: Next.js metadata는 서버 기반이라 클라이언트 네비게이션 중 async 반영 → flicker.
 * 이 컴포넌트가 pathname 변화에 맞춰 document.title 을 동기 업데이트해서 flicker 제거.
 *
 * SEO 동적 페이지(`/p/[id]`, `/u/[id]`, `/clubs/[slug]`)는 server metadata 가 더 구체적인
 * 타이틀을 내려주므로 skip — 덮어쓰면 "프로젝트 제목 | Draft" → "프로젝트 | Draft" 로 퇴화.
 */
export function TitleSync() {
  const pathname = usePathname()
  useEffect(() => {
    if (!pathname) return
    if (hasDynamicSeoMetadata(pathname)) return // server metadata 우선
    document.title = `${resolveTitle(pathname)} | Draft`
  }, [pathname])
  return null
}
