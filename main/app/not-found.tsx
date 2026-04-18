import Link from 'next/link'
import { Compass, Home } from 'lucide-react'

// Next.js App Router 의 404 페이지.
// 404 숫자 대신 아이콘 + 친근한 카피로 "오류" 보다 "안내" 느낌. Toss 스타일 — 큰 숫자나
// 에러 부호 대신 공백과 텍스트 위계로 전달.
export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center">
        {/* 소프트 아이콘 버블 */}
        <div className="w-20 h-20 rounded-2xl bg-brand-bg flex items-center justify-center mx-auto mb-6">
          <Compass size={32} className="text-brand" strokeWidth={1.5} />
        </div>

        <h1 className="text-[22px] font-bold text-txt-primary mb-2">
          찾으시는 페이지가 없네요
        </h1>
        <p className="text-[14px] text-txt-secondary leading-relaxed mb-8 break-keep">
          주소가 바뀌었거나 더 이상 존재하지 않는 페이지입니다.<br />
          홈으로 돌아가거나 새로운 프로젝트를 둘러보세요
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <Link
            href="/dashboard"
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
      </div>
    </div>
  )
}
