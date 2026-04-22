import { MiniLoader } from '@/components/ui/MiniLoader'
export default function Loading() {
  return (
    <MiniLoader
      heading="Discord 연결 상태를 확인하는 중"
      subheading="연결된 서버·권한 범위를 조회합니다. 서버 관리자 권한이 있어야 봇 초대가 가능합니다."
    />
  )
}
