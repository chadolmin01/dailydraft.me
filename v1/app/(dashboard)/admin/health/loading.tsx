import { MiniLoader } from '@/components/ui/MiniLoader'
export default function Loading() {
  return (
    <MiniLoader
      heading="헬스 모니터를 여는 중"
      subheading="DB·Auth 응답 시간을 10초 간격으로 폴링합니다. 페이지를 벗어나면 샘플이 초기화됩니다."
    />
  )
}
