import Link from 'next/link'

/**
 * /admin 하위 공통 layout — 간소한 sub-nav 제공.
 *
 * 왜:
 *   - 관리자 라우트가 10+ 로 늘어나면서 /admin 허브에서만 진입 가능한 구조는
 *     섹션 간 이동을 매번 홈으로 되돌아가게 만듦.
 *   - 모든 서브 라우트에 일관된 타이틀 바 + 빠른 이동 링크를 노출.
 *
 * 디자인:
 *   - 좌측 sidebar 가 아닌 상단 horizontal scroll 로 가는 이유 — 모바일·좁은 데스크톱에서도 무너지지 않게.
 *   - 활성 라우트 강조는 page 자체가 담당 (서버 컴포넌트로 pathname 접근 없이 구현 단순화).
 */

const SUB_LINKS = [
  { href: '/admin', label: '허브' },
  { href: '/admin/metrics', label: 'KPI' },
  { href: '/admin/health', label: '헬스' },
  { href: '/admin/users', label: '사용자' },
  { href: '/admin/opportunities', label: '프로젝트' },
  { href: '/admin/institutions', label: '기관' },
  { href: '/admin/invite-codes', label: '초대코드' },
  { href: '/admin/activity', label: '활동' },
  { href: '/admin/error-logs', label: '에러' },
  { href: '/admin/incidents', label: '인시던트' },
  { href: '/admin/audit', label: '감사' },
  { href: '/admin/platform-admins', label: '관리자' },
]

export default function AdminSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-bg">
      {/* 상단 sub-nav — 스크롤 가능, 모바일에서도 손상 없음 */}
      <nav
        aria-label="관리자 메뉴"
        className="sticky top-0 z-20 bg-surface-card/90 backdrop-blur-sm border-b border-border"
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="flex items-center gap-1 overflow-x-auto py-2 text-[12px] font-semibold text-txt-secondary scrollbar-hide">
            {SUB_LINKS.map((l) => (
              <li key={l.href} className="shrink-0">
                <Link
                  href={l.href}
                  className="px-3 py-1.5 rounded-full hover:bg-surface-sunken hover:text-txt-primary transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      {children}
    </div>
  )
}
