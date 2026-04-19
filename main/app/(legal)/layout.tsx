import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

/**
 * 법적 고지 페이지 공통 레이아웃.
 * 대시보드 chrome 없이 읽기에만 집중. 인쇄 친화적.
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-bg">
      <header className="border-b border-border bg-surface-card print:hidden">
        <div className="max-w-[820px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-[13px] text-txt-secondary hover:text-txt-primary transition-colors"
          >
            <ArrowLeft size={14} />
            Draft 홈
          </Link>
          <span className="text-[11px] font-mono text-txt-tertiary">LEGAL</span>
        </div>
      </header>
      <main className="max-w-[820px] mx-auto px-4 sm:px-6 lg:px-8 py-10 print:py-0">
        {children}
      </main>
    </div>
  )
}
