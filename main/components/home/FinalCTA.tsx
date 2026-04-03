import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const FinalCTA: React.FC = () => {
  return (
    <section className="w-full py-20 px-6 md:px-10 bg-surface-inverse">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
          다음 프로젝트,
          <br />
          혼자 시작하지 마세요
        </h2>
        <p className="text-sm md:text-base text-gray-400 mb-8 max-w-lg mx-auto leading-relaxed break-keep">
          프로젝트를 올리고, 함께할 팀원을 찾아보세요.
          <br className="hidden sm:inline" />
          1분이면 시작할 수 있어요.
        </p>
        <Link
          href="/login"
          className="group inline-flex items-center gap-2 bg-white text-black rounded-full px-8 py-4 text-base font-bold hover:bg-gray-100 transition-colors active:scale-[0.97]"
        >
          지금 시작하기
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </Link>
        <p className="mt-4 text-xs text-gray-500">
          무료로 시작 · 신용카드 필요 없음
        </p>
      </div>
    </section>
  )
}
