import { MiniLoader } from '@/components/ui/MiniLoader'
export default function Loading() {
  return (
    <MiniLoader
      heading="자동화 목록을 불러오는 중"
      subheading="매주 주간 업데이트·AI 콘텐츠 생성·외부 SNS 발행 등 설정된 자동화 규칙을 확인합니다."
    />
  )
}
