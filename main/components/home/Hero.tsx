'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
}

export const Hero: React.FC = () => {
  return (
    <section className="relative w-full min-h-[80vh] flex items-center justify-center px-4 sm:px-6 md:px-10">
      <motion.div
        className="flex flex-col items-center text-center max-w-2xl mx-auto py-20 sm:py-28"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div variants={fadeUp}>
          <span className="inline-block text-[13px] font-medium text-txt-secondary border border-border rounded-full px-4 py-1.5 mb-7">
            대학 동아리 · 스터디 · 소그룹 운영 인프라
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={fadeUp}
          className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.15] text-txt-primary mb-6 break-keep"
        >
          동아리 운영,
          <br />
          이제 <span className="text-brand">Draft</span> 하나로
        </motion.h1>

        {/* Sub copy */}
        <motion.p
          variants={fadeUp}
          className="text-base sm:text-lg text-txt-secondary leading-relaxed max-w-lg mb-10 break-keep"
        >
          주간 추적, 기수 인수인계, 성과 보고를 한 곳에서.
          <br className="hidden sm:block" />
          카톡·시트·노션을 오가던 반복 업무가 사라집니다.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mb-8"
        >
          <Link
            href="/login"
            className="group w-full sm:w-auto flex items-center justify-center gap-2 bg-brand text-white px-7 py-3.5 rounded-full font-semibold text-[15px] hover:bg-brand-hover transition-all duration-200 active:scale-[0.97] shadow-sm"
          >
            무료로 시작하기
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
          <Link
            href="#demo"
            className="group w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-semibold text-[15px] border border-border text-txt-secondary hover:bg-surface-sunken transition-all duration-200"
          >
            <Play size={14} className="fill-current" />
            2분 데모 보기
          </Link>
        </motion.div>

        {/* Micro proof */}
        <motion.p
          variants={fadeUp}
          className="text-xs text-txt-tertiary"
        >
          대학 이메일(@*.ac.kr)로 가입 · 카드 등록 불필요 · PIPA 준수
        </motion.p>
      </motion.div>
    </section>
  )
}
