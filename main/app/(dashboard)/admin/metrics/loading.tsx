import { MiniLoader } from '@/components/ui/MiniLoader'
export default function Loading() {
  return (
    <MiniLoader
      heading="플랫폼 KPI 를 집계하는 중"
      subheading="11개 지표 + 최근 30일 snapshots 를 불러오고 있습니다. 10초 이내 완료됩니다."
    />
  )
}
