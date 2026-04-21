'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight } from 'lucide-react'

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

export const PersonaEngine: React.FC = () => {
  return (
    <section
      id="persona-engine"
      aria-labelledby="persona-engine-title"
      className="relative w-full py-28 sm:py-36 px-4 sm:px-6 lg:px-8 overflow-hidden"
      style={{ background: 'var(--color-surface-bg)' }}
    >
      {/* Soft aurora — 섹션 포커스 */}
      <div
        aria-hidden="true"
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
            <Sparkles size={13} aria-hidden="true" />
            <span lang="en">Persona Engine</span>
          </motion.p>
          <motion.h2
            id="persona-engine-title"
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
            를 AI가 기억합니다
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-[15px] sm:text-[16px] text-txt-secondary leading-[1.65] max-w-[36rem] mx-auto break-keep"
          >
            운영자가 직접 쓰던 Instagram · LinkedIn · Discord 공지 · 뉴스레터를
            Draft가 동아리 톤으로 초안까지 만들어 둡니다. 검토·발행은 1분.
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
          {/* ── LEFT: 실제 페르소나 설정 화면 스크린샷 ──
              텍스트 슬롯 리스트 목업 대신 실제 /clubs/[slug]/settings/persona 페이지.
              "13 슬롯 + Discord 대화 학습 + 수동 수정" 메시지를 UI 로 직접 전달. */}
          <motion.div
            variants={fadeUp}
            className="lg:col-span-2 relative rounded-2xl overflow-hidden border border-border shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)] bg-surface-card"
          >
            <Image
              src="/landing/screenshots/02_persona.png"
              alt="Draft 페르소나 설정 — 13 슬롯으로 동아리 톤 정의"
              width={2878}
              height={1452}
              className="w-full h-auto"
              sizes="(min-width: 1024px) 480px, 100vw"
            />
          </motion.div>

          {/* ── RIGHT: 실제 Draft Bot 주간 리포트 스크린샷 ──
              레퍼런스 목업 4개 대신 진짜 Discord 에 발행된 리포트 1 장으로 교체.
              Why: "AI 가 우리 동아리 톤으로 써 준다"의 증빙은 목업이 아니라 실제 출력.
                   3층 포지셔닝의 "소통은 원하는 곳에"가 Discord 맥락 안에서 자연스럽게 전달.
          */}
          <motion.div
            variants={fadeUp}
            className="lg:col-span-3 relative rounded-2xl overflow-hidden border border-border shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)] bg-surface-card"
          >
            <Image
              src="/landing/screenshots/03_ghostwriter.png"
              alt="Draft Bot 이 Discord 에 자동 발행한 주간 현황 리포트"
              width={2074}
              height={1105}
              className="w-full h-auto"
              sizes="(min-width: 1024px) 720px, 100vw"
              priority={false}
            />
          </motion.div>
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
            className="group inline-flex items-center gap-1.5 bg-surface-inverse text-txt-inverse rounded-full px-6 py-3 text-[14px] font-semibold hover:opacity-90 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            Pro로 열기
            <ArrowRight
              size={14}
              aria-hidden="true"
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </Link>
          <p className="text-[12px] text-txt-tertiary">
            Free는 동아리 운영 코어 · Pro부터 페르소나 엔진
          </p>
        </motion.div>
      </div>
    </section>
  )
}
