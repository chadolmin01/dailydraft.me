/**
 * Institution 대시보드: 학교/기관 요약 통계 스트립 + 섹션 카드.
 * 공용 (dashboard)/loading.tsx 와 shape 불일치라 전용 스켈레톤.
 */
export default function InstitutionLoading() {
  return (
    <div className="skeleton-delayed bg-surface-bg min-h-full">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="h-4 w-20 skeleton-shimmer rounded-full" />
          <div className="h-8 w-56 skeleton-shimmer rounded-2xl" />
        </div>

        {/* KPI 스트립 */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="bg-surface-card border border-border rounded-2xl p-4 space-y-2">
              <div className="h-3 w-12 skeleton-shimmer rounded-full" />
              <div className="h-6 w-16 skeleton-shimmer rounded-xl" />
            </div>
          ))}
        </div>

        {/* 큰 카드 2개 (클럽 리스트 + 최근 활동) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[0, 1].map(i => (
            <div key={i} className="bg-surface-card border border-border rounded-2xl p-5 space-y-3">
              <div className="h-5 w-32 skeleton-shimmer rounded-full" />
              <div className="space-y-2">
                {[0, 1, 2, 3].map(j => (
                  <div key={j} className="h-14 skeleton-shimmer rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
