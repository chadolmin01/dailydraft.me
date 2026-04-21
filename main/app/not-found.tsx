import Link from 'next/link'
import { Compass, Home, Search, MessagesSquare, FileText, Activity } from 'lucide-react'

// Next.js App Router 의 404 페이지.
// 404 숫자 대신 아이콘 + 친근한 카피로 "오류" 보다 "안내" 느낌. Toss 스타일.
// 복귀 버튼 외에도 서비스 진입 경로 4개 및 상태 페이지 링크를 제공해 막다른 길 느낌을 줄임.
export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full text-center">
        {/* 소프트 아이콘 버블 */}
        <div className="w-20 h-20 rounded-2xl bg-brand-bg flex items-center justify-center mx-auto mb-6">
          <Compass size={32} className="text-brand" strokeWidth={1.5} />
        </div>

        <h1 className="text-[22px] font-bold text-txt-primary mb-2">
          찾으시는 페이지가 없네요
        </h1>
        <p className="text-[14px] text-txt-secondary leading-relaxed mb-6 break-keep">
          주소가 바뀌었거나 아직 준비되지 않은 페이지입니다.
          <br />
          홈으로 돌아가거나 아래 빠른 진입으로 이동해 보세요.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center mb-8">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand text-white text-[14px] font-bold hover:bg-brand-hover active:scale-[0.97] transition-all shadow-sm"
          >
            <Home size={15} />
            홈으로 돌아가기
          </Link>
          <Link
            href="/explore"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border bg-surface-card text-txt-primary text-[14px] font-bold hover:bg-surface-sunken transition-colors"
          >
            <Compass size={15} />
            둘러보기
          </Link>
        </div>

        {/* 빠른 진입 */}
        <div className="grid grid-cols-2 gap-2 text-[12px] text-txt-secondary">
          <QuickLink href="/feed" icon={Search} label="공개 피드" />
          <QuickLink href="/help" icon={FileText} label="자주 묻는 질문" />
          <QuickLink href="/contact" icon={MessagesSquare} label="연락처" />
          <QuickLink href="/status" icon={Activity} label="시스템 상태" />
        </div>

        <p className="text-[11px] text-txt-tertiary mt-8">
          다른 문제가 있으시면{' '}
          <a
            href="mailto:team@dailydraft.me?subject=404%20Report"
            className="text-brand underline"
          >
            team@dailydraft.me
          </a>{' '}
          로 어떤 URL 을 시도했는지 알려주세요.
        </p>
      </div>
    </div>
  )
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: typeof Home; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface-card hover:border-txt-tertiary hover:text-txt-primary transition-colors"
    >
      <Icon size={14} className="text-txt-tertiary" />
      {label}
    </Link>
  )
}
