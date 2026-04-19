import Link from 'next/link'
import { Compass, Home, Search } from 'lucide-react'

/**
 * Dashboard 라우트 그룹 404 — TopNavbar 유지하면서 맥락 안에서 안내.
 * 루트 `app/not-found.tsx` 는 전체 화면 버블이지만, 대시보드 안에서 잘못된 경로는
 * nav 컨텍스트를 유지한 채 간단 안내가 UX 상 더 자연스러움.
 */
export default function DashboardNotFound() {
  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="bg-surface-card border border-border rounded-2xl p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-bg flex items-center justify-center mx-auto mb-5">
          <Compass size={26} className="text-brand" strokeWidth={1.5} />
        </div>

        <h2 className="text-[20px] font-bold text-txt-primary mb-2">
          찾으시는 페이지가 없어요
        </h2>
        <p className="text-[14px] text-txt-secondary leading-relaxed max-w-md mx-auto break-keep mb-6">
          경로가 바뀌었거나 삭제된 항목일 수 있습니다.
          홈에서 다시 시작하거나 탐색 페이지로 가보세요.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white text-[14px] font-bold hover:bg-brand-hover active:scale-[0.97] transition-all shadow-sm"
          >
            <Home size={14} />
            홈으로
          </Link>
          <Link
            href="/explore"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-surface-card text-txt-secondary text-[14px] font-bold hover:bg-surface-sunken hover:text-txt-primary transition-colors"
          >
            <Search size={14} />
            탐색 페이지
          </Link>
        </div>
      </div>
    </div>
  )
}
