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
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
}

type Status = 'active' | 'upcoming'

interface Integration {
  initial: string
  title: string
  status: Status
  statusLabel: string
  benefit: string
  description: string
}

const integrations: Integration[] = [
  {
    initial: 'D',
    title: 'Discord',
    status: 'active',
    statusLabel: '연동 가능',
    benefit: '팀 대화 → 주간 리포트',
    description:
      '봇 초대 한 번이면 팀 채널의 진행상황이 자동 수집됩니다. 회장이 묻지 않아도 됩니다.',
  },
  {
    initial: 'S',
    title: 'Slack',
    status: 'upcoming',
    statusLabel: '지원 예정',
    benefit: '워크스페이스 자동 수집',
    description:
      'Slack을 주로 쓰는 동아리도 동일한 자동화를 곧 사용할 수 있습니다.',
  },
  {
    initial: 'X',
    title: '엑셀 · 시트 · 노션',
    status: 'active',
    statusLabel: '지원 중',
    benefit: '기존 데이터 한 번에 임포트',
    description:
      '멤버 명단, 역할, 기수 정보를 손실 없이 그대로 옮길 수 있습니다.',
  },
]

const statusDotColor: Record<Status, string> = {
  active: 'bg-status-success-text',
  upcoming: 'bg-status-warning-text',
}

export const Ecosystem: React.FC = () => {
  return (
    <section className="w-full py-24 sm:py-32 px-6 md:px-10">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-14"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          <motion.h2
            variants={fadeUp}
            className="text-2xl md:text-3xl lg:text-4xl font-bold text-txt-primary mb-4"
          >
            이미 쓰고 있는 도구와 함께
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-sm sm:text-base text-txt-secondary max-w-lg mx-auto break-keep"
          >
            Draft는 기존 소통 채널을 대체하지 않습니다. 연동합니다.
          </motion.p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {integrations.map((item) => (
            <motion.div
              key={item.title}
              variants={fadeUp}
              className="flex flex-col items-center text-center border border-border rounded-xl p-8"
            >
              {/* Initial mark */}
              <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-bold text-lg mb-5">
                {item.initial}
              </div>

              <h3 className="text-lg font-bold text-txt-primary mb-2">
                {item.title}
              </h3>

              {/* Status indicator */}
              <div className="flex items-center gap-1.5 mb-4">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${statusDotColor[item.status]}`}
                />
                <span className="text-xs text-txt-tertiary">
                  {item.statusLabel}
                </span>
              </div>

              {/* Key benefit */}
              <p className="text-sm font-semibold text-brand mb-3">
                {item.benefit}
              </p>

              <p className="text-sm text-txt-secondary leading-relaxed break-keep">
                {item.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
