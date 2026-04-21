/**
 * Admin 허브: 권한 요약 카드 + 섹션별(클럽/기관/플랫폼) 링크 리스트.
 * 공용 (dashboard)/loading.tsx 는 2컬럼 그리드라 admin 리스트 구조와 불일치.
 */
export default function AdminLoading() {
  return (
    <div className="skeleton-delayed bg-surface-bg min-h-full">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="h-4 w-24 skeleton-shimmer rounded-full" />
          <div className="h-8 w-48 skeleton-shimmer rounded-2xl" />
          <div className="h-4 w-80 skeleton-shimmer rounded-full" />
        </div>

        {/* Tier summary cards (4개) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="bg-surface-card border border-border rounded-2xl p-5 space-y-2">
              <div className="h-4 w-16 skeleton-shimmer rounded-full" />
              <div className="h-7 w-12 skeleton-shimmer rounded-xl" />
              <div className="h-3 w-full skeleton-shimmer rounded-full" />
            </div>
          ))}
        </div>

        {/* Section groups */}
        {[0, 1].map(section => (
          <section key={section} className="space-y-3">
            <div className="h-5 w-32 skeleton-shimmer rounded-full" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[0, 1, 2].map(i => (
                <div key={i} className="bg-surface-card border border-border rounded-2xl p-5 h-28 skeleton-shimmer" />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
