/**
 * 클럽 설정 페이지 전용 skeleton — 뒤로가기·섹션 리스트 레이아웃.
 * 공용 clubs/[slug]/loading.tsx 의 탭바 + 3 카드 그리드와 mismatch.
 */
export default function ClubSettingsLoading() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-5 w-5 skeleton-shimmer rounded" />
        <div className="space-y-1.5">
          <div className="h-5 w-24 skeleton-shimmer rounded" />
          <div className="h-3 w-48 skeleton-shimmer rounded" />
        </div>
      </div>

      {/* 설정 섹션 4개 */}
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="bg-surface-card border border-border rounded-2xl p-5 space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 skeleton-shimmer rounded" />
            <div className="h-8 w-20 skeleton-shimmer rounded-lg" />
          </div>
          <div className="h-3 w-full max-w-lg skeleton-shimmer rounded" />
          <div className="h-3 w-3/4 max-w-md skeleton-shimmer rounded" />
        </div>
      ))}
    </div>
  )
}
