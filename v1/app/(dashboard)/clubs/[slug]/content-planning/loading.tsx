import { MiniLoader } from '@/components/ui/MiniLoader'
export default function Loading() {
  return (
    <MiniLoader
      heading="콘텐츠 플래닝 보드를 불러오는 중"
      subheading="AI 가 추천한 아이디어·작성 대기·초안·발행 완료 4단계로 정리됩니다. 아이디어 제외 시 AI 가 학습합니다."
    />
  )
}
