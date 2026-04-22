import { MiniLoader } from '@/components/ui/MiniLoader'
export default function Loading() {
  return (
    <MiniLoader
      heading="기관 리포트를 불러오는 중"
      subheading="소속 동아리·프로젝트·주간 업데이트를 집계하고 있습니다. 내보내기(CSV·JSON)는 상단 버튼에서 가능합니다."
    />
  )
}
