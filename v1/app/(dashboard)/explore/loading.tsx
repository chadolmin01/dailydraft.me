import { MiniLoader } from '@/components/ui/MiniLoader'

/**
 * Explore 로딩 — 이전엔 SkeletonGrid 6개로 wireframe 을 채웠으나,
 * 실제로는 Explore 클라이언트가 자체 스켈레톤을 렌더하므로 중복.
 * 이 route-level loading 은 최소 스피너로만.
 */
export default function ExploreLoading() {
  return <MiniLoader heading="탐색을 불러오는 중" />
}
