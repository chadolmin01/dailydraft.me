import { MiniLoader } from '@/components/ui/MiniLoader'
export default function Loading() {
  return (
    <MiniLoader
      heading="팀 목록을 불러오는 중"
      subheading="기관 소속 학생들이 참여 중인 팀을 집계합니다. 팀별 주간 업데이트 현황도 여기서 한 번에 보실 수 있습니다."
    />
  )
}
