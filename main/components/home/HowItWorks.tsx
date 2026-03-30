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
    <section id="how-it-works" className="w-full py-20 px-6 md:px-10 bg-surface-card">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[0.625rem] font-medium text-txt-tertiary mb-3 block">
            HOW IT WORKS
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-txt-primary">
            간단한 3단계
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative flex flex-col items-center text-center p-6 bg-surface-card rounded-xl border border-border shadow-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200"
            >
              {/* Step number */}
              <div className="absolute -top-2.5 -left-2.5 w-6 h-6 bg-surface-inverse text-txt-inverse flex items-center justify-center text-xs font-bold">
                {index + 1}
              </div>

              {/* Icon */}
              <div className="w-12 h-12 bg-surface-card rounded-xl border border-border flex items-center justify-center mb-4">
                <step.icon size={22} className="text-txt-secondary" />
              </div>

              {/* Title */}
              <h3 className="text-base font-bold text-txt-primary mb-2">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-txt-secondary text-xs leading-relaxed break-keep">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Connecting lines (desktop only) */}
        <div className="hidden md:flex justify-center mt-8">
          <div className="flex items-center gap-4 text-txt-disabled">
            <div className="w-24 h-[1px] border-t border-border"></div>
            <span className="text-[0.625rem] font-medium">SIMPLE FLOW</span>
            <div className="w-24 h-[1px] border-t border-border"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
