import { MiniLoader } from '@/components/ui/MiniLoader'
export default function Loading() {
  return (
    <MiniLoader
      heading="클럽 분석을 불러오는 중"
      subheading="멤버 활동·주간 업데이트·콘텐츠 참여도를 집계합니다. 최근 12주까지 그래프로 표시됩니다."
    />
  )
}
