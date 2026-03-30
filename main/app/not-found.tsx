import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="border-2 border-border-strong bg-surface-card p-12 shadow-brutal">
          <div className="text-[8rem] font-mono font-bold leading-none text-txt-primary tracking-tighter">
            404
          </div>
          <div className="w-full h-px bg-border-strong my-6" />
          <p className="text-[0.625rem] font-medium text-txt-tertiary mb-2">
            PAGE NOT FOUND
          </p>
          <p className="text-sm text-txt-secondary mb-8">
            요청하신 페이지를 찾을 수 없습니다.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/explore"
              className="px-6 py-2.5 bg-surface-inverse text-txt-inverse text-sm font-bold border border-surface-inverse hover:opacity-90 active:scale-[0.97] transition-all"
            >
              탐색하기
            </Link>
            <Link
              href="/"
              className="px-6 py-2.5 bg-surface-card text-txt-secondary text-sm font-medium border border-border-strong hover:bg-surface-sunken transition-colors"
            >
              홈으로
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
