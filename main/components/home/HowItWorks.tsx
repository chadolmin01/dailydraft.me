'use client'

import React from 'react'
import { Upload, MessageCircle, Coffee } from 'lucide-react'

const steps = [
  {
    icon: Upload,
    title: '프로젝트 올리기',
    description: '아이디어 단계든 진행 중이든, 고민 포인트와 함께 공유하세요',
  },
  {
    icon: MessageCircle,
    title: '피드백 받고 탐색하기',
    description: '다른 사람들의 훈수를 받고, 관심 가는 프로젝트에 관심 표현하세요',
  },
  {
    icon: Coffee,
    title: '커피챗으로 만나기',
    description: '마음 맞으면 가볍게 만나서 이야기 나눠보세요',
  },
]

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="w-full py-32 px-6 md:px-12 bg-surface-sunken">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <span className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-tertiary mb-4 block">
            HOW IT WORKS
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-txt-primary">
            간단한 3단계
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative flex flex-col items-center text-center p-8 bg-surface-card border border-border shadow-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200"
            >
              {/* Step number */}
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-black text-white flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>

              {/* Icon */}
              <div className="w-16 h-16 bg-surface-sunken border border-border flex items-center justify-center mb-6">
                <step.icon size={28} className="text-txt-secondary" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-txt-primary mb-3">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-txt-secondary text-sm leading-relaxed break-keep">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Connecting lines (desktop only) */}
        <div className="hidden md:flex justify-center mt-8">
          <div className="flex items-center gap-4 text-txt-disabled">
            <div className="w-24 h-[1px] border-t border-dashed border-border"></div>
            <span className="text-[0.625rem] font-mono font-bold uppercase tracking-widest">SIMPLE FLOW</span>
            <div className="w-24 h-[1px] border-t border-dashed border-border"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
