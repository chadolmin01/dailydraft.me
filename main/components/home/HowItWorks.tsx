'use client'

import React from 'react'
import { UserPlus, Brain, Compass, Coffee, Rocket } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { SectionLabel, SectionTitle } from './shared'

const steps = [
  {
    icon: UserPlus,
    title: '가입 & 온보딩',
    description: '기본 정보 입력 후 인터랙티브 질문 몇 가지에 답하면 프로필이 완성돼요.',
  },
  {
    icon: Brain,
    title: 'AI가 분석해요',
    description: '팀 성향, 소통 스타일, 강점을 분석해 당신만의 프로필과 추천 분야를 만들어줍니다.',
  },
  {
    icon: Compass,
    title: '프로젝트 탐색',
    description: 'AI가 매칭한 프로젝트와 사람을 발견하세요. 관심 분야별로 필터도 가능해요.',
  },
  {
    icon: Coffee,
    title: '커피챗 신청',
    description: '관심 있는 팀에 가볍게 연락하세요. 수락되면 연락처가 공개됩니다.',
  },
  {
    icon: Rocket,
    title: '팀빌딩 시작',
    description: '프로젝트 업데이트, 팀원 관리, 주간 리포트까지. 함께 만들어가세요.',
  },
]

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="w-full py-16 px-6 md:px-10 bg-surface-card">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <SectionLabel>HOW IT WORKS</SectionLabel>
          <SectionTitle>5단계로 시작하는 팀빌딩</SectionTitle>
        </div>

        {/* Desktop: 5-column grid — all steps visible */}
        <div className="hidden md:grid grid-cols-5 gap-4">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <ScrollReveal key={i} delay={i * 0.08}>
                <div className="relative flex flex-col items-center text-center">
                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div className="absolute top-5 left-[55%] w-full h-0.5 bg-border" />
                  )}
                  {/* Step number circle */}
                  <div className="relative z-10 w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold mb-3">
                    {i + 1}
                  </div>
                  {/* Icon */}
                  <div className="w-11 h-11 bg-brand/10 rounded-xl flex items-center justify-center mb-3">
                    <Icon size={20} className="text-brand" />
                  </div>
                  {/* Title */}
                  <h3 className="text-sm font-bold text-txt-primary mb-1.5">
                    {step.title}
                  </h3>
                  {/* Description */}
                  <p className="text-xs text-txt-secondary leading-relaxed break-keep">
                    {step.description}
                  </p>
                </div>
              </ScrollReveal>
            )
          })}
        </div>

        {/* Mobile: Vertical timeline — all steps visible */}
        <div className="md:hidden space-y-0">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={i} className="flex gap-4">
                {/* Timeline line + circle */}
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-0.5 flex-1 bg-border my-1" />
                  )}
                </div>
                {/* Content */}
                <div className="pb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={16} className="text-brand shrink-0" />
                    <h3 className="text-sm font-bold text-txt-primary">{step.title}</h3>
                  </div>
                  <p className="text-xs text-txt-secondary leading-relaxed break-keep">
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
