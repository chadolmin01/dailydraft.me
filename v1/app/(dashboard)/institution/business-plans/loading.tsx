import { MiniLoader } from '@/components/ui/MiniLoader'
export default function Loading() {
  return (
    <MiniLoader
      heading="사업계획서 목록을 불러오는 중"
      subheading="소속 학생이 작성한 초안·완성본을 모두 모아 드립니다. PDF·DOCX 일괄 내보내기도 가능합니다."
    />
  )
}
