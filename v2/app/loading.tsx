// 루트 로딩 스켈레톤 — 라우트 전환 시 Next.js 가 자동 표시.
// design.md 토큰만 사용. 깜빡임 최소화 위해 fade-in 없음.

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <div className="flex items-center gap-3 text-muted">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted animate-pulse" />
        <span className="text-body-sm">불러오는 중…</span>
      </div>
    </div>
  )
}
