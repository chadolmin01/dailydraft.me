import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'Draft v3',
  description: '창업센터 운영 워크스페이스 (로컬 데모)',
}

// 의도: v3 = 인증 없는 single-user 로컬 데모. nav 가 모든 페이지 공통.
//       멤버용 /m/[token] 페이지는 별도 layout (nav 없음) 필요 시 분리.
const NAV = [
  { href: '/', label: '홈' },
  { href: '/programs', label: '프로그램' },
  { href: '/teams', label: '팀' },
  { href: '/collection', label: '주간 수집' },
  { href: '/dashboard', label: '대시보드' },
  { href: '/reports', label: '보고서' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <header className="border-b border-hairline bg-white sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-6">
            <Link href="/" className="font-bold text-ink">Draft v3</Link>
            <nav className="flex items-center gap-1">
              {NAV.slice(1).map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="px-3 py-1.5 text-sm text-muted hover:text-ink rounded-lg hover:bg-surface"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
            <span className="ml-auto text-xs text-muted-soft">로컬 데모 · SQLite</span>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  )
}
