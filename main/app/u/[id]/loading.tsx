// 유저 공개 프로필 전용 스켈레톤.
// 외부 공유 링크로 들어오는 첫인상 페이지 — 레이아웃 shift 최소화가 중요.
// UserProfilePageClient 레이아웃: max-w-[900px], 상단바 + 헤더 + 바이오 + 섹션.
export default function UserProfileLoading() {
  return (
    <div className="skeleton-delayed max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 상단바: 뒤로가기 + 공유/PDF 버튼 */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-5 w-20 skeleton-shimmer rounded-full" />
        <div className="flex items-center gap-2">
          <div className="h-7 w-24 skeleton-shimmer rounded-full" />
          <div className="h-7 w-20 skeleton-shimmer rounded-full" />
        </div>
      </div>

      {/* 헤더: 아바타 + 이름 + 포지션/소속 */}
      <div className="flex gap-4 mb-6">
        <div className="w-20 h-20 skeleton-shimmer rounded-full shrink-0" />
        <div className="flex-1 space-y-2.5 pt-1">
          <div className="h-6 skeleton-shimmer rounded-full w-40" />
          <div className="h-4 skeleton-shimmer rounded-full w-60" />
          <div className="flex gap-2 pt-1">
            <div className="h-6 skeleton-shimmer rounded-full w-16" />
            <div className="h-6 skeleton-shimmer rounded-full w-20" />
          </div>
        </div>
      </div>

      {/* 바이오 / vision 카드 */}
      <div className="bg-surface-card border border-border rounded-2xl p-5 mb-5 space-y-2.5">
        <div className="h-3.5 skeleton-shimmer rounded-full w-full" />
        <div className="h-3.5 skeleton-shimmer rounded-full w-11/12" />
        <div className="h-3.5 skeleton-shimmer rounded-full w-3/5" />
      </div>

      {/* 스킬 칩 */}
      <div className="mb-6">
        <div className="h-4 skeleton-shimmer rounded-full w-16 mb-3" />
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="h-7 skeleton-shimmer rounded-full" style={{ width: `${60 + (i % 3) * 12}px` }} />
          ))}
        </div>
      </div>

      {/* 활동 섹션 */}
      <div className="space-y-3">
        <div className="h-4 skeleton-shimmer rounded-full w-24" />
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-surface-card border border-border rounded-xl p-4 flex gap-3">
            <div className="w-10 h-10 skeleton-shimmer rounded-lg shrink-0" />
            <div className="flex-1 space-y-2 pt-0.5">
              <div className="h-3.5 skeleton-shimmer rounded-full w-32" />
              <div className="h-3 skeleton-shimmer rounded-full w-52" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
