import { MiniLoader } from '@/components/ui/MiniLoader'
export default function Loading() {
  return (
    <MiniLoader
      heading="공지사항을 불러오는 중"
      subheading="기관 멤버 전체 또는 선택 대상에 이메일로 발송하실 수 있습니다. 발송 이력은 목록 하단에 쌓입니다."
    />
  )
}
