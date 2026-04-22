import { MiniLoader } from '@/components/ui/MiniLoader'
export default function Loading() {
  return (
    <MiniLoader
      heading="감사 로그를 불러오는 중"
      subheading="최근 100건을 기본으로 표시하며, 필터 적용 시 범위가 달라질 수 있습니다."
    />
  )
}
