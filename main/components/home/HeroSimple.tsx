'use client'

import React from 'react'
import { ArrowRight } from 'lucide-react'

interface HeroSimpleProps {
  onCtaClick: () => void
}

export const HeroSimple: React.FC<HeroSimpleProps> = ({ onCtaClick }) => {
  return (
    <section className="w-full pt-8 pb-12 px-6 md:px-12 border-b border-gray-200">
      <div className="max-w-4xl mx-auto">
        {/* Badge */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
            Draft Community
          </span>
        </div>

        {/* Main Copy */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight leading-[1.15] mb-4">
          프로젝트를 공유하고,<br />
          <span className="text-gray-400">피드백을 받으세요.</span>
        </h1>

        <p className="text-lg text-gray-500 mb-8 max-w-xl leading-relaxed">
          아이디어 단계부터 MVP까지. 다른 메이커들의 피드백을 받고,
          <br className="hidden md:inline" />
          마음 맞는 팀원을 찾아보세요.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-start gap-3">
          <button
            onClick={onCtaClick}
            className="group flex items-center gap-2 bg-black text-white px-6 py-3 font-bold text-sm hover:bg-gray-800 transition-colors"
          >
            프로젝트 올리기
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={() => {
              const feedSection = document.getElementById('project-feed')
              feedSection?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="text-sm font-medium text-gray-500 hover:text-black transition-colors px-2 py-3"
          >
            오늘의 프로젝트 둘러보기 ↓
          </button>
        </div>

        {/* Stats */}
        <div className="mt-10 pt-6 border-t border-gray-100 flex items-center gap-8">
          <div>
            <div className="text-2xl font-mono font-bold text-gray-900">127</div>
            <div className="text-[10px] font-mono text-gray-400 uppercase">Projects</div>
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-gray-900">892</div>
            <div className="text-[10px] font-mono text-gray-400 uppercase">Feedbacks</div>
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-gray-900">45</div>
            <div className="text-[10px] font-mono text-gray-400 uppercase">Teams Formed</div>
          </div>
        </div>
      </div>
    </section>
  )
}
