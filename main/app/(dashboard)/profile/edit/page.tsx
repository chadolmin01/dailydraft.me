'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 구버전 edit 페이지 → /profile로 리다이렉트 (프로필 수정은 SlidePanel 사용)
export default function ProfileEditRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/profile')
  }, [router])

  return null
}
