import { MiniLoader } from '@/components/ui/MiniLoader'
export default function Loading() {
  return (
    <MiniLoader
      heading="가입 안내를 불러오는 중"
      subheading="초대 코드를 확인하고 가입 폼을 준비하고 있습니다. 운영진에게 받은 코드를 입력하시면 바로 가입됩니다."
    />
  )
}
