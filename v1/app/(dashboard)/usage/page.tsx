/**
 * @deprecated MVP 모드 숨김 (access manifest: tier='hidden', middleware 가 /explore 리다이렉트).
 * 사용량 대시보드 — AI 크레딧·API 호출 등 개인 사용량 추적. 결제 플랜 도입 시 재활성화.
 */
'use client'

import { UsageDashboard } from '@/components/UsageDashboard'

export default function UsagePage() {
  return <UsageDashboard />
}
