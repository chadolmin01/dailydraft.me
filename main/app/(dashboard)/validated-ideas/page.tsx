/**
 * @deprecated MVP 모드 숨김 (access manifest: tier='hidden', middleware 가 /explore 리다이렉트).
 * B2C 아이디어 검증 플로우의 결과물 저장소. B2B2C 피봇 이후 메인 경로에서 빠짐.
 * Phase C 에서 창업지원단 B2B 대시보드에 통합 재검토 예정.
 */
'use client'

import { Suspense } from 'react'
import { ValidatedIdeasPage } from '@/components/ValidatedIdeasPage'

export default function ValidatedIdeas() {
  return (
    <Suspense>
      <ValidatedIdeasPage />
    </Suspense>
  )
}
