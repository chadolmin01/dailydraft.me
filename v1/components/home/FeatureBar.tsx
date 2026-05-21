'use client'

import React from 'react'
import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
}

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const features = [
  {
    title: '주간 추적 자동화',
    description: 'Discord 봇이 팀별 진행상황을 자동 수집',
  },
  {
    title: '기수별 아카이브',
    description: '운영 맥락이 다음 기수까지 이어집니다',
  },
  {
    title: '원클릭 성과 보고',
    description: '활동 기록에서 보고서를 자동 생성',
  },
]

export const FeatureBar: React.FC = () => {
  return (
    <section
      id="features"
      aria-label="핵심 기능 요약"
      className="py-16 px-6 md:px-10 border-y border-border"
    >
      <motion.ul
        className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-4 list-none p-0 m-0"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
      >
        {features.map((f, i) => (
          <motion.li
            key={f.title}
            variants={fadeUp}
            className={`flex flex-col items-center text-center px-4 ${
              i < features.length - 1 ? 'sm:border-r sm:border-border' : ''
            }`}
          >
            {/* 제목은 h3 — 페이지에서 h2 섹션 제목 아래 위계 유지 */}
            <h3 className="text-base font-bold text-txt-primary mb-1.5">
              {f.title}
            </h3>
            <p className="text-sm text-txt-secondary">
              {f.description}
            </p>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  )
}
