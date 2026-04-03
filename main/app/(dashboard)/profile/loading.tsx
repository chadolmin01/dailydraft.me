import { SkeletonProfile, SkeletonGrid } from '@/components/ui/Skeleton'

export default function ProfileLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <SkeletonProfile />
      <SkeletonGrid count={2} cols={2} />
    </div>
  )
}
