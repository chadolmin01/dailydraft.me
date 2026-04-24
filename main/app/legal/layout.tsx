import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

/**
 * Meta App Review 대응 공개 법적 페이지 전용 레이아웃.
 * - 로그인 없이 접근 가능해야 함 (Meta 리뷰어 익명 접근 전제)
 * - navbar/sidebar/footer 배제. 최소한의 chrome 만 유지.
 * - print 친화적 — 학교/기관 법무 검토 시 인쇄 수요 대비.
 *
 * 구조 결정:
 * - 기존 `(legal)` 라우트 그룹에도 privacy/terms 가 있으나 그 그룹의 URL 은 `/privacy`, `/terms`.
 * - Meta 제출 URL 은 `/legal/privacy`, `/legal/terms`, `/legal/data-deletion` 으로 별도 분리
 *   (`docs/meta-app-review/privacy-policy-checklist.md` 참조). 이 경로가 Meta app settings
 *   URL 필드에 들어가는 최종 공개 링크.
 *
 * 접근성:
 * - 상위 `app/layout.tsx` 에 `<html lang="ko">` 선언되어 있어 여기서 중복 금지.
 * - skip-link 는 상위 layout 의 전역 링크가 `#main-content` 를 가리키므로, 본 layout 의 `<main>`
 *   id 도 반드시 `main-content` 로 맞춰야 키보드 사용자가 건너뛸 수 있음.
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-bg">
      <header className="border-b border-border bg-surface-card print:hidden">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-[13px] text-txt-secondary hover:text-txt-primary transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Draft 홈
          </Link>
          <nav aria-label="법적 페이지" className="flex items-center gap-3 flex-wrap text-[12px] text-txt-tertiary">
            <Link
              href="/legal/privacy"
              className="hover:text-txt-primary transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded"
            >
              개인정보
            </Link>
            <Link
              href="/legal/terms"
              className="hover:text-txt-primary transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded"
            >
              약관
            </Link>
            <Link
              href="/legal/data-deletion"
              className="hover:text-txt-primary transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded"
            >
              데이터 삭제
            </Link>
            <Link
              href="/legal/retention"
              className="hover:text-txt-primary transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded"
            >
              보관·파기
            </Link>
            <Link
              href="/legal/subprocessors"
              className="hover:text-txt-primary transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded"
            >
              수탁업체
            </Link>
            <Link
              href="/legal/cookies"
              className="hover:text-txt-primary transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded"
            >
              쿠키
            </Link>
          </nav>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="max-w-3xl mx-auto px-6 py-16 print:py-0 focus:outline-hidden">
        {children}
      </main>
    </div>
  )
}
