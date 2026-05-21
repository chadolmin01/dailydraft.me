import { StatusPageClient } from '@/components/status/StatusPageClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '시스템 상태 · Draft',
  description:
    'Draft 핵심 시스템의 실시간 가용성·SLO·최근 인시던트 이력 공개. Atom 피드 구독 가능.',
  alternates: {
    canonical: '/status',
    types: { 'application/atom+xml': '/status/feed.xml' },
  },
  other: {
    'link:rel=alternate type=application/atom+xml': '/status/feed.xml',
  },
}

/**
 * /status — 공개 시스템 현황 페이지.
 *
 * 정보주체·기관·대외 신뢰용. 인증 불필요.
 * 실시간 데이터는 클라이언트에서 /api/health polling.
 * Atom 피드(/status/feed.xml) 로 외부 모니터링 대시보드에서 구독 가능.
 */
export default function StatusPage() {
  return <StatusPageClient />
}
