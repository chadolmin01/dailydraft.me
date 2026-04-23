'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, Play, MessageSquare, Hash, Users } from 'lucide-react'

/**
 * Hero — 3층 포지셔닝 기반 재설계
 *
 * 메모 근거:
 *   positioning_three_layers.md — "운영은 Draft / 소통은 원하는 곳에"
 *   product_cognitive_system.md — Draft = 동아리의 인지 시스템
 *
 * 디자인 레퍼런스:
 *   - Linear: 어두운 background 없이 light 에서도 aurora mesh 를 약하게
 *   - Vercel/Raycast: editorial 타이포 + 얇은 아이콘 라인
 *   - Toss: 부드러운 spring, 큰 여백, 파스텔 글로우
 */

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
  },
}

/** 3층 포지셔닝의 1층: "소통은 원하는 곳에" — 중립 메신저 아이콘 행 */
const MESSENGERS = [
  { name: 'KakaoTalk', short: '카톡', icon: MessageSquare },
  { name: 'Slack', short: 'Slack', icon: Hash },
  { name: 'Discord', short: 'Discord', icon: Users },
]

export const Hero: React.FC = () => {
  return (
    <section className="relative w-full overflow-hidden">
      {/* ── Aurora mesh background (Linear/Stripe 레퍼런스) ── */}
      {/* 배경은 순수 CSS 그라디언트 — 이미지 요청 없음, 성능 영향 0 */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(94, 106, 210, 0.12), transparent 70%),' +
            'radial-gradient(ellipse 40% 40% at 85% 30%, rgba(80, 180, 255, 0.08), transparent 60%),' +
            'radial-gradient(ellipse 40% 40% at 15% 40%, rgba(255, 180, 200, 0.06), transparent 60%)',
        }}
      />

      {/* ── 섬세한 dot grid — 0.03 투명도, 운영툴의 "정리됨" 인상 ── */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            'radial-gradient(circle, var(--color-txt-primary) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative w-full min-h-[82vh] flex items-center justify-center px-4 sm:px-6 md:px-10">
        <motion.div
          className="flex flex-col items-center text-center max-w-3xl mx-auto py-20 sm:py-28"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {/* Badge — "인지 시스템" 메타포 암시 */}
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-txt-secondary bg-surface-card border border-border rounded-full px-3.5 py-1.5 mb-8 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <span className="relative flex w-1.5 h-1.5">
                <span className="absolute inset-0 rounded-full bg-brand opacity-60 animate-ping" />
                <span className="relative rounded-full w-1.5 h-1.5 bg-brand" />
              </span>
              동아리의 인지 시스템
            </span>
          </motion.div>

          {/* H1 — 3층 포지셔닝 원문 카피 */}
          <motion.h1
            variants={fadeUp}
            className="text-[40px] sm:text-[56px] md:text-[68px] font-bold tracking-[-0.035em] leading-[1.05] text-txt-primary mb-7 break-keep"
          >
            운영은 Draft에,
            <br />
            소통은{' '}
            <span className="relative inline-block">
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, #5E6AD2 0%, #7B83E0 50%, #A0A8EC 100%)',
                }}
              >
                원하는 곳에
              </span>
            </span>
            .
          </motion.h1>

          {/* Sub copy — 인지 시스템 메타포 직접 활용 */}
          <motion.p
            variants={fadeUp}
            className="text-[15px] sm:text-[17px] md:text-[18px] text-txt-secondary leading-[1.65] max-w-[36rem] mb-4 break-keep"
          >
            카톡·Slack·Discord — 어디서 얘기하든 동아리의 기록은 끊기지 않습니다.
            <br className="hidden sm:block" />
            AI가 감각과 기억 사이를 이어 줍니다.
          </motion.p>

          {/* 엔터프라이즈 신뢰 한 줄 — 아이콘/뱃지 없이 작은 텍스트만.
              SLO 는 실측이 아니라 목표치이므로 "target" 명시. 대학/기관 실사 대비. */}
          <motion.p
            variants={fadeUp}
            className="text-[11.5px] text-txt-tertiary tracking-wide mb-9"
          >
            AES-256 암호화 · PIPA 준수 · 공개 SLO 99.9% target
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto mb-8"
          >
            <Link
              href="/login"
              className="ob-press-spring group w-full sm:w-auto flex items-center justify-center gap-1.5 bg-surface-inverse text-txt-inverse px-7 py-3.5 rounded-full font-semibold text-[14px] hover:opacity-90 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_16px_-2px_rgba(94,106,210,0.25)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.12),0_8px_24px_-4px_rgba(94,106,210,0.35)]"
            >
              무료로 시작하기
              <ArrowRight
                size={15}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
            <Link
              href="#demo"
              className="group w-full sm:w-auto flex items-center justify-center gap-1.5 px-7 py-3.5 rounded-full font-semibold text-[14px] text-txt-secondary hover:bg-surface-sunken transition-colors duration-200"
            >
              <Play size={13} className="fill-current" />
              2분 데모 보기
            </Link>
          </motion.div>

          {/* Micro proof */}
          <motion.p
            variants={fadeUp}
            className="text-[11.5px] text-txt-tertiary mb-12"
          >
            대학 이메일 (@*.ac.kr) 인증 · 카드 등록 불필요 · PIPA 준수
          </motion.p>

          {/* 3층 포지셔닝 visual row — "소통은 원하는 곳에" 의 시각화 */}
          <motion.div variants={fadeUp} className="w-full max-w-md">
            <p className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-txt-disabled mb-4">
              쓰는 메신저 그대로
            </p>
            <div className="flex items-center justify-center gap-3">
              {MESSENGERS.map((m) => {
                const Icon = m.icon
                return (
                  <div
                    key={m.name}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-surface-card border border-border text-[12px] font-semibold text-txt-secondary"
                  >
                    <Icon size={13} className="text-txt-tertiary" />
                    {m.short}
                  </div>
                )
              })}
              <span className="text-txt-disabled font-mono mx-1" aria-hidden>
                →
              </span>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-brand text-white text-[12px] font-bold shadow-[0_2px_8px_-2px_rgba(94,106,210,0.4)]">
                Draft
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* ── 실제 Draft 대시보드 스크린샷 — Hero 텍스트 아래 이어서 노출 ──
          Why: "인지 시스템" "운영 OS" 같은 추상 카피는 AI 티가 날 위험이 큼.
               방문자 눈이 내려오는 첫 번째 지점에 "진짜 제품이 이렇게 생겼다"는 증빙을 배치.
          민감 정보(유저 이름·프로필)는 블러 처리된 상태로 ship. */}
      <div className="relative w-full px-4 sm:px-6 md:px-10 pb-20 sm:pb-28 -mt-8 sm:-mt-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto max-w-5xl rounded-2xl overflow-hidden border border-border shadow-[0_20px_60px_-20px_rgba(94,106,210,0.35),0_8px_24px_-8px_rgba(0,0,0,0.12)] bg-surface-card"
        >
          <Image
            src="/landing/screenshots/01_dashboard.png"
            alt="Draft 대시보드 — 오늘 할 일과 운영 중인 클럽 한눈에"
            width={2861}
            height={1469}
            priority
            className="w-full h-auto"
            sizes="(min-width: 1024px) 960px, 100vw"
          />
        </motion.div>
      </div>
    </section>
  )
}
