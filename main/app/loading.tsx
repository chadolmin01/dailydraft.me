import { SkeletonGrid } from '@/components/ui/Skeleton'
import { MicroPromptSlot } from '@/components/micro-prompts/MicroPromptSlot'

export default function Loading() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 space-y-5">
      <MicroPromptSlot context="root_loading" />
      <SkeletonGrid count={6} cols={3} />
    </div>
  )
}
