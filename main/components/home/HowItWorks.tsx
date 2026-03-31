'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Brain, Compass, Coffee, Rocket, Check } from 'lucide-react'
import { SectionLabel, SectionTitle } from './shared'

const steps = [
  {
    icon: UserPlus,
    title: '가입 & AI 온보딩',
    description: '1분 대화로 프로필 완성. 관심사, 기술 스택, 목표를 AI가 정리해줍니다.',
  },
  {
    icon: Brain,
    title: 'AI가 분석해요',
    description: '강점, 파운더 유형, 추천 분야를 생성합니다. 당신만의 프로필이 만들어져요.',
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
  const [activeStep, setActiveStep] = useState(0)

  return (
    <section id="how-it-works" className="w-full py-20 px-6 md:px-10 bg-surface-card">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <SectionLabel>HOW IT WORKS</SectionLabel>
          <SectionTitle>5단계로 시작하는 팀빌딩</SectionTitle>
        </div>

        {/* ── Desktop: Horizontal stepper ── */}
        <div className="hidden md:block">
          {/* Step indicators + connecting line */}
          <div className="relative flex items-center justify-between mb-10 px-4">
            {/* Background line */}
            <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-border" />
            {/* Progress line */}
            <div
              className="absolute top-5 left-[10%] h-0.5 bg-brand transition-all duration-500"
              style={{ width: `${(activeStep / (steps.length - 1)) * 80}%` }}
            />

            {steps.map((step, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className="relative z-10 flex flex-col items-center gap-2 group"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    i < activeStep
                      ? 'bg-surface-inverse text-txt-inverse'
                      : i === activeStep
                        ? 'bg-brand text-white ring-4 ring-brand/20'
                        : 'bg-surface-sunken text-txt-disabled border border-border'
                  }`}
                >
                  {i < activeStep ? <Check size={16} /> : i + 1}
                </div>
                <span className={`text-[10px] font-medium transition-colors ${
                  i === activeStep ? 'text-brand' : 'text-txt-tertiary'
                }`}>
                  {step.title}
                </span>
              </button>
            ))}
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="bg-surface-card rounded-xl border border-border p-8 text-center max-w-lg mx-auto"
            >
              <div className="w-14 h-14 bg-brand/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                {React.createElement(steps[activeStep].icon, { size: 24, className: 'text-brand' })}
              </div>
              <h3 className="text-lg font-bold text-txt-primary mb-2">
                {steps[activeStep].title}
              </h3>
              <p className="text-sm text-txt-secondary leading-relaxed break-keep">
                {steps[activeStep].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Mobile: Vertical accordion ── */}
        <div className="md:hidden space-y-3">
          {steps.map((step, i) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              className={`w-full text-left rounded-xl border p-4 transition-all duration-200 ${
                i === activeStep
                  ? 'border-brand bg-brand/5'
                  : 'border-border bg-surface-card'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  i < activeStep
                    ? 'bg-surface-inverse text-txt-inverse'
                    : i === activeStep
                      ? 'bg-brand text-white'
                      : 'bg-surface-sunken text-txt-disabled'
                }`}>
                  {i < activeStep ? <Check size={12} /> : i + 1}
                </div>
                <span className={`text-sm font-bold ${i === activeStep ? 'text-brand' : 'text-txt-primary'}`}>
                  {step.title}
                </span>
              </div>
              <AnimatePresence>
                {i === activeStep && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-txt-secondary leading-relaxed mt-3 pl-11 break-keep"
                  >
                    {step.description}
                  </motion.p>
                )}
              </AnimatePresence>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
