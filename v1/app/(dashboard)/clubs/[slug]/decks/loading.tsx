import { MiniLoader } from '@/components/ui/MiniLoader'
export default function Loading() {
  return (
    <MiniLoader
      heading="덱 모음을 불러오는 중"
      subheading="한 번에 여러 채널용 글을 묶은 덱입니다. 승인·수정·예약 발행을 한 화면에서 하실 수 있습니다."
    />
  )
}
