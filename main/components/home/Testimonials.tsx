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

const testimonials = [
  {
    quote:
      '매주 월요일 아침이 두려웠는데, 이제 대시보드 한 번 열면 끝입니다.',
    author: '박서연',
    role: '멋쟁이사자처럼 12기 회장',
  },
  {
    quote:
      '성과 보고서를 3일 걸려서 만들었는데, 이제 진짜 10초입니다.',
    author: '이준혁',
    role: '프로그라피 운영진',
  },
  {
    quote:
      '인수인계 때 관리자 권한만 넘기면 끝. 스트레스가 사라졌습니다.',
    author: '최하린',
    role: '넥스터즈 24기 부회장',
  },
]

export const Testimonials: React.FC = () => {
  return (
    <section className="w-full py-24 sm:py-32 px-6 md:px-10 bg-surface-card">
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
            운영자들의 이야기
          </motion.h2>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.author}
              variants={fadeUp}
              className="bg-surface-card rounded-xl border border-border p-6 flex flex-col"
            >
              <p className="text-sm italic text-txt-primary leading-relaxed break-keep flex-1 mb-5">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div>
                <span className="text-xs text-txt-tertiary font-semibold">
                  {t.author} · {t.role}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
