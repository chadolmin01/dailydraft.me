import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-6xl sm:text-7xl font-bold text-txt-primary tracking-tight mb-4">
          404
        </h1>
        <p className="text-base text-txt-primary font-semibold mb-2">
          페이지를 찾을 수 없습니다
        </p>
        <p className="text-sm text-txt-secondary mb-8 break-keep">
          주소가 변경되었거나 더 이상 존재하지 않는 페이지입니다.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="px-5 py-3 rounded-full bg-brand text-white text-sm font-bold hover:bg-brand-hover active:scale-[0.97] transition-all shadow-sm"
          >
            홈으로
          </Link>
          <Link
            href="/explore"
            className="px-5 py-3 rounded-full border border-border bg-surface-card text-txt-primary text-sm font-bold hover:bg-surface-sunken transition-colors"
          >
            탐색하기
          </Link>
        </div>
      </div>
    </div>
  )
}
