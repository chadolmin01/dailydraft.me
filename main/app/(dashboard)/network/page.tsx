import NetworkPageClient from '@/components/network/NetworkPageClient'

/**
 * /network — 사람 탐색 전용 라우트.
 * `/projects`·`/clubs`와 대칭되는 "사람" 카탈로그.
 * 기존 `/explore?tab=people`과 병존 (Explore는 대학·클럽 계층 탐사용 유지).
 */
export default function NetworkPage() {
  return <NetworkPageClient />
}
