'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
}

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
}

export const FinalCTA: React.FC = () => {
  return (
    <section className="w-full py-32 sm:py-40 px-6 md:px-10 bg-[#f7fbff] min-h-[50vh] flex items-center justify-center">
      <motion.div
        className="text-center max-w-2xl mx-auto"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
      >
        <motion.h2
          variants={fadeUp}
          className="text-3xl sm:text-4xl font-extrabold text-txt-primary leading-tight mb-5 whitespace-pre-line"
        >
          {'다음 기수에도 이어질\n동아리를 만드세요'}
        </motion.h2>
        <motion.p
          variants={fadeUp}
          className="text-sm sm:text-base text-txt-secondary mb-10 break-keep"
        >
          3분이면 시작합니다. 무료입니다. 카드 등록도 필요 없습니다.
        </motion.p>
        <motion.div variants={fadeUp}>
          <Link
            href="/login"
            className="inline-flex items-center justify-center bg-brand text-white rounded-full px-8 py-4 text-base font-bold hover:bg-brand-hover transition-colors active:scale-[0.97]"
          >
            무료로 시작하기
          </Link>
        </motion.div>
      </motion.div>
    </section>
  )
}
