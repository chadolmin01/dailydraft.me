/**
 * 프로젝트 상세 페이지 전용 skeleton.
 * ProjectManageContent 레이아웃: 뒤로가기 + Hero (아이콘+제목+상태+뱃지) + 탭바 + 본문.
 * 공용 (dashboard)/loading.tsx 의 2-col grid 와 mismatch → 진입 시 점프 발생.
 */
export default function ProjectDetailLoading() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
      {/* 뒤로가기 + 우측 액션 */}
      <div className="flex items-center justify-between">
        <div className="h-5 w-20 skeleton-shimmer rounded" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 skeleton-shimmer rounded-full" />
          <div className="h-8 w-20 skeleton-shimmer rounded-full" />
          <div className="h-8 w-16 skeleton-shimmer rounded-full" />
        </div>
      </div>

      {/* Hero: 아이콘 + 타이틀 + 상태 + 설명 */}
      <div className="flex items-start gap-5 mb-6">
        <div className="w-[72px] h-[72px] rounded-2xl skeleton-shimmer shrink-0" />
        <div className="flex-1 min-w-0 pt-1 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-52 skeleton-shimmer rounded" />
            <div className="h-5 w-16 skeleton-shimmer rounded-full" />
          </div>
          <div className="h-4 w-full max-w-2xl skeleton-shimmer rounded" />
          <div className="h-4 w-3/4 max-w-xl skeleton-shimmer rounded" />
          <div className="flex items-center gap-2 pt-1">
            <div className="h-3 w-16 skeleton-shimmer rounded" />
            <div className="h-3 w-24 skeleton-shimmer rounded" />
          </div>
        </div>
      </div>

      {/* 탭바 */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-7 w-20 skeleton-shimmer rounded-full" />
        ))}
      </div>

      {/* 본문 업데이트 리스트 */}
      <div className="space-y-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-surface-card border border-border rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full skeleton-shimmer shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-32 skeleton-shimmer rounded" />
                <div className="h-3 w-20 skeleton-shimmer rounded" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="h-3.5 w-full skeleton-shimmer rounded" />
              <div className="h-3.5 w-5/6 skeleton-shimmer rounded" />
              <div className="h-3.5 w-3/4 skeleton-shimmer rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
