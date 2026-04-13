'use client'

import React from 'react'
import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
}

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
}

const steps = [
  {
    number: 1,
    title: '동아리 등록',
    description: '이름, 학교, 카테고리 입력.',
    time: '30초',
    detail: '초대 코드를 생성해 멤버에게 공유하세요.',
  },
  {
    number: 2,
    title: 'Discord 봇 연동',
    description: '한 번 클릭으로 봇 추가.',
    time: '1분',
    detail: 'Discord, Slack(예정), 카카오톡 — 어떤 메신저든 괜찮습니다.',
  },
  {
    number: 3,
    title: '첫 주간 리포트',
    description: '다음 월요일, 자동 생성된 리포트 확인.',
    time: '자동',
    detail: '팀별 진행률·핵심 이슈·다음 액션까지.',
  },
]

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="w-full py-24 sm:py-32 px-6 md:px-10">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
        >
          <motion.h2
            variants={fadeUp}
            className="text-2xl md:text-3xl lg:text-4xl font-bold text-txt-primary mb-3"
          >
            3분이면 시작합니다
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-sm text-txt-secondary"
          >
            복잡한 세팅 없이, 바로 운영에 집중하세요.
          </motion.p>
        </motion.div>

        {/* Steps — horizontal on desktop */}
        <motion.div
          className="relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {/* Connecting line (desktop only) */}
          <div
            className="hidden md:block absolute top-5 h-px bg-border"
            style={{ left: 'calc(16.67% + 20px)', right: 'calc(16.67% + 20px)' }}
            aria-hidden
          />

          {steps.map((step) => (
            <motion.div
              key={step.number}
              variants={fadeUp}
              className="flex flex-col items-center text-center"
            >
              {/* Number circle */}
              <div className="relative z-10 w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-bold text-lg mb-5">
                {step.number}
              </div>

              <h3 className="text-base font-bold text-txt-primary mb-1.5">
                {step.title}
              </h3>
              <p className="text-sm text-txt-secondary leading-relaxed break-keep mb-2">
                {step.description}
              </p>
              <span className="text-xs font-semibold text-brand mb-3">
                {step.time}
              </span>
              <p className="text-xs text-txt-tertiary leading-relaxed break-keep">
                {step.detail}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
