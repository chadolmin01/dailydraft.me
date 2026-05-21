import { MiniLoader } from '@/components/ui/MiniLoader'
export default function Loading() {
  return (
    <MiniLoader
      heading="소속 학생 목록을 불러오는 중"
      subheading="검색·역할 필터·페이지네이션이 적용됩니다. 학생 추가는 상단 버튼, 대량 초대는 '공지 일괄 발송' 에서 하실 수 있습니다."
    />
  )
}
