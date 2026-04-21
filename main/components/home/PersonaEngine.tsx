'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Instagram,
  Linkedin,
  Hash,
  Mail,
  Sparkles,
  ArrowRight,
  Lock,
} from 'lucide-react'

/**
 * Persona Engine Section — 핵심 수익축 시각화
 *
 * 메모 근거:
 *   persona_engine_design.md      — 3계층 페르소나, Discord corpus 학습, 외부 SNS 발행
 *   persona_engine_revenue_model.md — Pro = "조직 운영권 판매" 포지션
 *
 * 디자인 레퍼런스:
 *   - Raycast 랜딩: bento grid (varied spans, 실제 UI 스크린샷 느낌)
 *   - Vercel: dark bento card 위에 color-accent glow
 *   - mirra.my: 한국 브랜드 감성, "톤을 기억한다" 메시지
 *   - Framer: 편집 가능한 카드 느낌 + hover lift
 */

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
}

/** 페르소나 슬롯 예시 — 실제 UI 구조 그대로 */
const PERSONA_SLOTS = [
  { label: '정체성', value: '창업동아리 FLIP · 10기' },
  { label: '톤·화법', value: '합쇼체 · 수치 중심 · 과장 지양' },
  { label: '독자', value: '20대 초반 창업 관심 학생' },
  { label: '금기', value: '느낌표 남발 · 상투적 인사' },
]

/** 채널별 브랜드 정체성 반영 */
const CHANNELS = [
  {
    id: 'instagram',
    icon: Instagram,
    label: 'Instagram',
    accent: 'from-pink-500 to-orange-400',
    accentSolid: 'text-pink-500',
    preview: {
      kicker: '이번 주 팀 활동',
      body: '10기 5개 팀이 이번 주 사용자 인터뷰를 끝냈습니다. 가장 많이 나온 피드백은 "결제 UX"였고, 다음 주 프로토타입에 반영합니다.',
      tags: ['#FLIP10기', '#창업동아리', '#주간회고'],
    },
  },
  {
    id: 'linkedin',
    icon: Linkedin,
    label: 'LinkedIn',
    accent: 'from-sky-600 to-blue-500',
    accentSolid: 'text-sky-600',
    preview: {
      kicker: '운영자 업데이트',
      body: 'FLIP 10기 중간 점검 완료. 5개 팀 중 3개 팀이 MVP 배포 단계에 진입했고, 2개 팀은 문제 정의 피벗 중입니다. 다음 단계는 투자자 네트워킹.',
      tags: ['#StudentStartup', '#FLIP'],
    },
  },
  {
    id: 'discord',
    icon: Hash,
    label: 'Discord',
    accent: 'from-indigo-500 to-violet-500',
    accentSolid: 'text-indigo-500',
    preview: {
      kicker: '#공지',
      body: '이번 주 발표 순서 공유드립니다. 화요일 7시, 10기 중간 데모데이입니다. 멘토 2분 모시고 진행합니다. 팀별 10분씩 준비해 주세요.',
      tags: [],
    },
  },
  {
    id: 'email',
    icon: Mail,
    label: '뉴스레터',
    accent: 'from-emerald-500 to-teal-500',
    accentSolid: 'text-emerald-600',
    preview: {
      kicker: '10기 Week 5',
      body: '안녕하세요, FLIP 알럼나이 여러분. 이번 주 10기 진척을 정리해 보내 드립니다. 지난주 인터뷰 40건, 프로토타입 3개가 사용자 테스트에 들어갔습니다.',
      tags: [],
    },
  },
] as const

export const PersonaEngine: React.FC = () => {
  return (
    <section
      id="persona-engine"
      className="relative w-full py-28 sm:py-36 px-4 sm:px-6 lg:px-8 overflow-hidden"
      style={{ background: 'var(--color-surface-bg)' }}
    >
      {/* Soft aurora — 섹션 포커스 */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 30% 20%, rgba(94, 106, 210, 0.10), transparent 60%),' +
            'radial-gradient(ellipse 50% 40% at 80% 70%, rgba(147, 51, 234, 0.06), transparent 60%)',
        }}
      />

      <div className="relative max-w-[1200px] mx-auto">
        {/* Header */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="text-center mb-16 sm:mb-20"
        >
          <motion.p
            variants={fadeUp}
            className="text-[11px] font-mono uppercase tracking-[0.18em] text-brand mb-4 flex items-center justify-center gap-2"
          >
            <Sparkles size={13} />
            Persona Engine
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="text-[30px] sm:text-[40px] md:text-[46px] font-bold tracking-[-0.025em] leading-[1.1] text-txt-primary mb-5 break-keep"
          >
            한 번 설정하면,
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  'linear-gradient(135deg, #5E6AD2 0%, #9333EA 100%)',
              }}
            >
              동아리의 목소리
            </span>
            를 AI 가 기억합니다
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-[15px] sm:text-[16px] text-txt-secondary leading-[1.65] max-w-[36rem] mx-auto break-keep"
          >
            운영자가 직접 쓰던 Instagram · LinkedIn · Discord 공지 · 뉴스레터를
            Draft 가 동아리 톤으로 초안까지 만들어 놓습니다. 검토·발행은 1분.
          </motion.p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 lg:grid-cols-5 gap-4"
        >
          {/* ── LEFT: Persona Slots (large card) ── */}
          <motion.div
            variants={fadeUp}
            className="lg:col-span-2 bg-surface-card border border-border rounded-2xl p-6 sm:p-7 flex flex-col shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-txt-tertiary mb-1">
                  페르소나 슬롯
                </p>
                <h3 className="text-[17px] font-bold text-txt-primary">
                  우리 동아리 톤
                </h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-brand-bg flex items-center justify-center">
                <Sparkles size={14} className="text-brand" />
              </div>
            </div>

            <div className="space-y-2 flex-1">
              {PERSONA_SLOTS.map((slot, i) => (
                <div
                  key={slot.label}
                  className="flex items-start gap-3 p-3 bg-surface-bg rounded-xl"
                >
                  <span className="text-[10px] font-mono text-txt-disabled font-bold shrink-0 mt-0.5 w-4">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-txt-tertiary mb-0.5">
                      {slot.label}
                    </p>
                    <p className="text-[13px] text-txt-primary leading-[1.45]">
                      {slot.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-5 border-t border-border flex items-center gap-2 text-[11px] text-txt-tertiary">
              <Lock size={11} />
              Discord 대화에서 자동으로 학습 · 수동 수정 가능
            </div>
          </motion.div>

          {/* ── RIGHT: 4 Channel Outputs (2x2) ── */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CHANNELS.map((ch) => {
              const Icon = ch.icon
              return (
                <motion.div
                  key={ch.id}
                  variants={fadeUp}
                  className="group relative bg-surface-card border border-border rounded-2xl p-5 flex flex-col overflow-hidden hover:border-brand/30 transition-colors duration-200"
                >
                  {/* Channel accent glow on hover */}
                  <div
                    aria-hidden
                    className={`absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-2xl bg-gradient-to-br ${ch.accent}`}
                  />

                  {/* Channel badge */}
                  <div className="relative flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-surface-bg flex items-center justify-center">
                        <Icon size={14} className={ch.accentSolid} />
                      </div>
                      <span className="text-[12px] font-semibold text-txt-primary">
                        {ch.label}
                      </span>
                    </div>
                    <span className="text-[9.5px] font-mono uppercase tracking-[0.14em] text-txt-disabled px-1.5 py-0.5 rounded bg-surface-bg">
                      Draft
                    </span>
                  </div>

                  {/* Preview content */}
                  <div className="relative flex-1 flex flex-col">
                    <p className="text-[10.5px] font-semibold text-txt-tertiary mb-1.5">
                      {ch.preview.kicker}
                    </p>
                    <p className="text-[13px] text-txt-primary leading-[1.55] line-clamp-4 mb-3 break-keep">
                      {ch.preview.body}
                    </p>
                    {ch.preview.tags.length > 0 && (
                      <p className="text-[11px] text-brand font-medium mt-auto">
                        {ch.preview.tags.join(' ')}
                      </p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            href="#pricing"
            className="group inline-flex items-center gap-1.5 bg-surface-inverse text-txt-inverse rounded-full px-6 py-3 text-[14px] font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Pro 로 열기
            <ArrowRight
              size={14}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </Link>
          <p className="text-[12px] text-txt-tertiary">
            Free 는 동아리 운영 코어 · Pro 부터 페르소나 엔진
          </p>
        </motion.div>
      </div>
    </section>
  )
}
