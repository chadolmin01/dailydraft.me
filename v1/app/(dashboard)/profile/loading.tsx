// 실제 ProfilePageClient 레이아웃(좌 sidebar + 우 메인) 맞춤. 기존 SkeletonGrid는 레이아웃 shift 발생.
import { ProfileLoadingSkeleton } from '@/components/profile/ProfileLoadingSkeleton'

export default function ProfileLoading() {
  return <ProfileLoadingSkeleton />
}
