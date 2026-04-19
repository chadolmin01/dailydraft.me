// 공개 프로젝트 상세 전용 스켈레톤.
// 외부 공유 링크 첫인상 페이지. ProjectDetail 레이아웃: max-w-4xl, hero + title + tags + 2-col 그리드.
export default function ProjectDetailLoading() {
  return (
    <div className="min-h-screen bg-surface-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero 이미지 */}
        <div className="h-56 skeleton-shimmer rounded-xl mb-6" />

        {/* 제목 */}
        <div className="h-7 w-2/3 skeleton-shimmer rounded-full mb-3" />
        <div className="h-4 w-1/3 skeleton-shimmer rounded-full mb-6" />

        {/* 태그 */}
        <div className="flex gap-2 mb-6">
          <div className="h-6 w-16 skeleton-shimmer rounded-full" />
          <div className="h-6 w-20 skeleton-shimmer rounded-full" />
          <div className="h-6 w-14 skeleton-shimmer rounded-full" />
        </div>

        {/* 본문 + 사이드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-3">
            <div className="h-4 skeleton-shimmer rounded-full" />
            <div className="h-4 skeleton-shimmer rounded-full w-5/6" />
            <div className="h-4 skeleton-shimmer rounded-full w-4/6" />
            <div className="h-4 skeleton-shimmer rounded-full w-3/4" />
            <div className="h-4 skeleton-shimmer rounded-full w-5/6" />
          </div>
          <div className="space-y-3">
            <div className="h-24 skeleton-shimmer rounded-xl" />
            <div className="h-20 skeleton-shimmer rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
