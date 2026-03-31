import { SkeletonGrid } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <SkeletonGrid count={4} cols={2} />
    </div>
  )
}
