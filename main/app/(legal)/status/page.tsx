import { StatusPageClient } from '@/components/status/StatusPageClient'

/**
 * /status — 공개 시스템 현황 페이지.
 *
 * 정보주체·기관·대외 신뢰용. 인증 불필요.
 * 실시간 데이터는 클라이언트에서 /api/health polling.
 * 수동 공지(장애/유지보수)는 추후 status_incidents 테이블 추가로 확장.
 */
export default function StatusPage() {
  return <StatusPageClient />
}
