'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Ear, Sparkles, Database } from 'lucide-react'

/**
 * Cognitive System Section — 인지 시스템 메타포 시각화
 *
 * 메모 근거:
 *   product_cognitive_system.md —
 *     Discord/Slack = 감각기관
 *     Draft         = 구조화된 기억
 *     AI 파이프라인 = 신경계
 *
 * 디자인 레퍼런스:
 *   - Stripe "connected" 섹션: 좌→우 흐름을 그라디언트 라인으로 표현
 *   - Linear "changelog" 섹션: 대형 세리프 숫자 + 서브 카피
 *   - Arc 브라우저: 단계별 컬러 코딩
 */

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.05 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
  },
}

interface Layer {
  index: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  role: string
  title: string
  desc: string
  examples: string[]
  accent: string // tailwind bg class for the number pill
}

const LAYERS: Layer[] = [
  {
    index: '01',
    icon: Ear,
    role: '감각기관',
    title: '일은 원래 있던 곳에서',
    desc: '카톡 단톡방, Slack 채널, Discord 서버 — 팀이 이미 떠드는 공간을 그대로 씁니다. 새로 배울 게 없습니다.',
    examples: ['Discord 메시지', 'Slack 스레드', '카톡 단톡', 'GitHub 푸시'],
    accent: 'bg-surface-sunken text-txt-primary',
  },
  {
    index: '02',
    icon: Sparkles,
    role: '신경계',
    title: 'AI 가 중요한 것만 걸러',
    desc: '한 주간 쌓인 대화에서 진짜 진척·블로커·결정을 추려 내고, 운영자가 확인만 하면 되는 초안으로 만듭니다.',
    examples: ['주간 업데이트 초안', '블로커 하이라이트', '참여도 시그널'],
    accent:
      'bg-brand text-white shadow-[0_2px_12px_-2px_rgba(94,106,210,0.45)]',
  },
  {
    index: '03',
    icon: Database,
    role: '구조화된 기억',
    title: 'Draft 에 정리되어 쌓입니다',
    desc: '기수별 타임라인·멤버 기록·프로젝트 이력이 자동으로 축적됩니다. 다음 기수 회장이 열어 보면 바로 맥락이 잡힙니다.',
    examples: ['기수 타임라인', '멤버 포트폴리오', '성과 리포트', '알럼나이 네트워크'],
    accent: 'bg-surface-card border border-border text-txt-primary',
  },
]

export const CognitiveSystem: React.FC = () => {
  return (
    <section
      id="cognitive-system"
      className="relative w-full py-28 sm:py-36 px-4 sm:px-6 lg:px-8 border-y border-border bg-surface-card"
    >
      {/* 미묘한 글로우 — 섹션 의미 강화 */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 30% at 50% 100%, rgba(94, 106, 210, 0.06), transparent 70%)',
        }}
      />

      <div className="relative max-w-[1100px] mx-auto">
        {/* Header */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="text-center mb-20 sm:mb-24"
        >
          <motion.p
            variants={fadeUp}
            className="text-[11px] font-mono uppercase tracking-[0.18em] text-brand mb-4"
          >
            How Draft works
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="text-[30px] sm:text-[40px] md:text-[46px] font-bold tracking-[-0.025em] leading-[1.1] text-txt-primary mb-5 break-keep"
          >
            소통 → 기억, 그 사이를{' '}
            <span className="text-brand">AI 가 잇습니다</span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-[15px] sm:text-[16px] text-txt-secondary leading-[1.65] max-w-[32rem] mx-auto break-keep"
          >
            Draft 는 감각기관을 대체하지 않습니다. 대신 거기서 벌어진 일을
            읽어 내 동아리의 기록으로 쌓습니다.
          </motion.p>
        </motion.div>

        {/* 3-Layer Flow */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="relative grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4"
        >
          {/* Connecting line — desktop only, subtle gradient */}
          <div
            aria-hidden
            className="hidden md:block absolute top-[58px] left-[8%] right-[8%] h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(94,106,210,0.25) 30%, rgba(94,106,210,0.45) 50%, rgba(94,106,210,0.25) 70%, transparent 100%)',
            }}
          />

          {LAYERS.map((layer) => {
            const Icon = layer.icon
            return (
              <motion.div
                key={layer.index}
                variants={fadeUp}
                className="relative flex flex-col items-center text-center px-5 sm:px-6"
              >
                {/* Icon circle with index */}
                <div className="relative z-10 mb-8">
                  <div
                    className={`w-[72px] h-[72px] rounded-2xl flex items-center justify-center ${layer.accent}`}
                  >
                    <Icon size={26} strokeWidth={1.8} />
                  </div>
                  <span className="absolute -top-2 -right-2 text-[10px] font-mono font-bold text-txt-tertiary bg-surface-bg border border-border rounded-full px-1.5 py-0.5">
                    {layer.index}
                  </span>
                </div>

                {/* Role tag */}
                <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-txt-tertiary mb-3">
                  {layer.role}
                </p>

                {/* Title */}
                <h3 className="text-[19px] sm:text-[21px] font-bold text-txt-primary mb-3 leading-[1.25] break-keep">
                  {layer.title}
                </h3>

                {/* Description */}
                <p className="text-[14px] text-txt-secondary leading-[1.65] mb-6 break-keep">
                  {layer.desc}
                </p>

                {/* Example chips */}
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {layer.examples.map((ex) => (
                    <span
                      key={ex}
                      className="text-[11px] font-medium text-txt-tertiary bg-surface-bg rounded-md px-2 py-1"
                    >
                      {ex}
                    </span>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Footnote — "학생 부하 0" 원칙 */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center text-[13px] text-txt-tertiary mt-20 max-w-[34rem] mx-auto leading-[1.65] break-keep"
        >
          <span className="font-semibold text-txt-secondary">학생이 추가로 해야 할 일은 없습니다.</span>
          <br />
          운영자는 월요일 아침에 정리된 결과만 확인합니다.
        </motion.p>
      </div>
    </section>
  )
}
