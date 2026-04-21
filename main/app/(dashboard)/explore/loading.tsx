import { MiniLoader } from '@/components/ui/MiniLoader'

/**
 * Explore 로딩 — 이전엔 SkeletonGrid 6개로 wireframe 을 채웠으나,
 * 실제로는 Explore 클라이언트가 자체 스켈레톤을 렌더하므로 중복.
 * 이 route-level loading 은 최소 스피너로만.
 */
export default function ExploreLoading() {
<<<<<<< HEAD
  return (
    <div className="skeleton-delayed max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <MicroPromptSlot context="explore_loading" />
      <SkeletonGrid count={6} cols={3} />
    </div>
  )
=======
  return <MiniLoader heading="탐색을 불러오는 중" />
>>>>>>> 7a3ea30 (feat(ux): 자주 뜨는 loading.tsx 3개를 MiniLoader 로 단순화)
}
