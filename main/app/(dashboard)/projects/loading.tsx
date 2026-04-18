// 프로젝트 대시보드: 통계 스트립 + 카드 리스트. 공용 loading.tsx는 2컬럼 그리드라 여기선 안 맞음.
export default function ProjectsLoading() {
  return (
    <div className="bg-surface-bg min-h-full">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="h-7 w-28 skeleton-shimmer rounded-full" />
            <div className="h-9 w-32 skeleton-shimmer rounded-full" />
          </div>
          {/* 통계 4종 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map(i => <div key={i} className="h-20 skeleton-shimmer rounded-2xl" />)}
          </div>
          {/* 카드 리스트 */}
          <div className="space-y-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-56 skeleton-shimmer rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
