import { SkeletonGrid } from '@/components/ui/Skeleton'
import { MicroPromptSlot } from '@/components/micro-prompts/MicroPromptSlot'

export default function ExploreLoading() {
  return (
    <div className="skeleton-delayed max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <MicroPromptSlot context="explore_loading" />
      <SkeletonGrid count={6} cols={3} />
    </div>
  )
}
