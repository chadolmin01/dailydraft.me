import { SkeletonGrid, SkeletonSidebar } from '@/components/ui/Skeleton'

export default function ExploreLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        <div className="hidden lg:block w-56 shrink-0">
          <SkeletonSidebar />
        </div>
        <div className="flex-1">
          <SkeletonGrid count={6} cols={3} />
        </div>
      </div>
    </div>
  )
}
