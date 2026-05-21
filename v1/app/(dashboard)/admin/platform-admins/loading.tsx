import { MiniLoader } from '@/components/ui/MiniLoader'
export default function Loading() {
  return (
    <MiniLoader
      heading="플랫폼 관리자 목록을 불러오는 중"
      subheading="platform_admins 테이블에서 현재 등록된 admin·superadmin 을 조회합니다."
    />
  )
}
