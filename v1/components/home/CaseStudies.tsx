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

interface CaseResult {
  before: string
  after: string
  label: string
}

interface CaseCard {
  name: string
  meta: string
  quote: string
  quoter: string
  summary: string
  results: CaseResult[]
}

const cases: CaseCard[] = [
  {
    name: 'FLIP',
    meta: 'IT 창업 동아리 · 한국외대 · 24명',
    quote: '매주 월요일 3시간이 진짜 0분이 됐습니다.',
    quoter: '5기 회장',
    summary:
      '5개 팀 주간 추적을 Discord 봇으로 자동화. 수동 취합 완전 제거.',
    results: [
      { before: '3시간', after: '0분', label: '주간 추적' },
      { before: '2시간', after: '5분', label: '인수인계' },
      { before: '3일', after: '10초', label: '성과 보고' },
    ],
  },
  {
    name: 'GDSC KHU',
    meta: '구글 개발자 커뮤니티 · 경희대 · 30명',
    quote: '기수가 바뀌어도 맥락이 사라지지 않습니다.',
    quoter: '3기 리드',
    summary:
      '기수별 타임라인 자동 기록으로 신규 리드 적응 기간 2주 → 1일.',
    results: [
      { before: '0%', after: '100%', label: '기수 연속성' },
      { before: '2주', after: '1일', label: '리드 적응' },
      { before: '3일', after: '10초', label: '보고서 생성' },
    ],
  },
]

export const CaseStudies: React.FC = () => {
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
            className="text-2xl md:text-3xl lg:text-4xl font-bold text-txt-primary"
          >
            실제 동아리 사례
          </motion.h2>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {cases.map((c) => (
            <motion.div
              key={c.name}
              variants={fadeUp}
              className="border border-border rounded-xl p-6 sm:p-8 flex flex-col"
            >
              {/* Club identity */}
              <div className="mb-5">
                <h3 className="text-xl font-extrabold text-txt-primary">
                  {c.name}
                </h3>
                <p className="text-xs text-txt-tertiary mt-1">{c.meta}</p>
              </div>

              {/* Quote */}
              <p className="text-base font-medium text-txt-primary leading-relaxed break-keep mb-1">
                &ldquo;{c.quote}&rdquo;
              </p>
              <p className="text-xs text-txt-tertiary mb-5">
                &mdash; {c.quoter}
              </p>

              {/* Summary */}
              <p className="text-sm text-txt-secondary leading-relaxed break-keep mb-6">
                {c.summary}
              </p>

              {/* Results — big numbers */}
              <div className="grid grid-cols-3 gap-4 mt-auto pt-5 border-t border-border">
                {c.results.map((r) => (
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
