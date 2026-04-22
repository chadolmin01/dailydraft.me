import { MiniLoader } from '@/components/ui/MiniLoader'
export default function Loading() {
  return (
    <MiniLoader
      heading="콘텐츠 보드를 불러오는 중"
      subheading="발행된 글·예약된 글·덱 모음을 탭으로 구분해 보여 드립니다. 탭은 상단에서 전환하실 수 있습니다."
    />
  )
}
