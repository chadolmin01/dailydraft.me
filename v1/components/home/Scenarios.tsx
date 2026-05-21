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
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
}

interface ScenarioResult {
  before: string
  after: string
  label: string
}

interface Scenario {
  type: string
  example: string
  pain: string
  solution: string
  results: ScenarioResult[]
}

const scenarios: Scenario[] = [
  {
    type: 'IT 창업 동아리',
    example: '24명 · 5개 팀 · 5기째 운영 중',
    pain: '매주 5개 팀의 진행상황을 카톡·디코·시트에서 수동 취합하느라 3시간 소모',
    solution:
      'Discord 봇이 팀 채널에서 자동 수집 → 월요일 아침 대시보드에서 전체 현황 확인',
    results: [
      { before: '3시간', after: '0분', label: '주간 추적' },
      { before: '2시간', after: '5분', label: '인수인계' },
      { before: '3일', after: '10초', label: '성과 보고' },
    ],
  },
  {
    type: '개발자 커뮤니티',
    example: '30명 · 프로젝트 6개 · 3기째 운영 중',
    pain: '기수가 바뀔 때마다 노하우가 증발, 신규 리드 적응에 2주 이상 소요',
    solution:
      '기수별 타임라인이 자동 기록 → 이전 기수의 운영 맥락이 그대로 보존',
    results: [
      { before: '0%', after: '100%', label: '기수 연속성' },
      { before: '2주', after: '1일', label: '리드 적응' },
      { before: '3일', after: '10초', label: '보고서 생성' },
    ],
  },
]

export const Scenarios: React.FC = () => {
  return (
    <section
      id="use-cases"
      className="w-full py-24 sm:py-32 px-6 md:px-10"
    >
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
            className="text-2xl md:text-3xl lg:text-4xl font-bold text-txt-primary mb-3"
          >
            이런 동아리에 맞습니다
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-sm text-txt-secondary"
          >
            예상 절약 효과 시뮬레이션
          </motion.p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {scenarios.map((s) => (
            <motion.div
              key={s.type}
              variants={fadeUp}
              className="border border-border rounded-xl p-6 sm:p-8 flex flex-col"
            >
              {/* Identity */}
              <h3 className="text-xl font-extrabold text-txt-primary mb-1">
                {s.type}
              </h3>
              <p className="text-xs text-txt-tertiary mb-5">{s.example}</p>

              {/* Pain → Solution */}
              <div className="space-y-3 mb-6">
                <p className="text-sm text-txt-secondary leading-relaxed break-keep">
                  <span className="font-semibold text-txt-primary">문제</span>{' '}
                  {s.pain}
                </p>
                <p className="text-sm text-txt-secondary leading-relaxed break-keep">
                  <span className="font-semibold text-brand">Draft</span>{' '}
                  {s.solution}
                </p>
              </div>

              {/* Results */}
              <div className="grid grid-cols-3 gap-4 mt-auto pt-5 border-t border-border">
                {s.results.map((r) => (
                  <div key={r.label} className="text-center">
                    <p className="text-xs text-txt-tertiary line-through mb-1">
                      {r.before}
                    </p>
                    <p className="text-2xl font-extrabold text-brand leading-none">
                      {r.after}
                    </p>
                    <p className="text-[11px] text-txt-tertiary mt-1.5">
                      {r.label}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
