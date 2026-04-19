'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

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

const freePlan = {
  name: 'Free',
  price: '₩0',
  period: '영구 무료',
  features: [
    '동아리 1개',
    '멤버 50명까지',
    '주간 업데이트 자동화',
    '기수별 타임라인',
    '멤버·알럼나이 관리',
    'Discord 봇 연동',
  ],
}

const proPlan = {
  name: 'Pro',
  price: '출시 예정',
  period: '얼리버드 대기 중',
  features: [
    'Free의 모든 기능',
    '멤버 무제한',
    'AI 성과 분석 리포트',
    '다중 동아리 관리',
    'Slack 연동',
    '커스텀 보고서 양식',
    '우선 지원',
  ],
}

export const Pricing: React.FC = () => {
  return (
    <section id="pricing" className="w-full py-24 sm:py-32 px-6 md:px-10 bg-surface-card">
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
            가격
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-sm sm:text-base text-txt-secondary max-w-lg mx-auto break-keep"
          >
            기본 기능은 완전 무료입니다. 카드 등록도 필요 없습니다.
          </motion.p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {/* Free Plan */}
          <motion.div
            variants={fadeUp}
            className="border border-border rounded-xl p-8 flex flex-col"
          >
            <h3 className="text-lg font-bold text-txt-primary mb-2">
              {freePlan.name}
            </h3>
            <p className="text-3xl font-extrabold text-txt-primary mb-1">
              {freePlan.price}
            </p>
            <p className="text-xs text-txt-tertiary mb-6">{freePlan.period}</p>

            <ul className="space-y-3 flex-1 mb-8">
              {freePlan.features.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2.5 text-sm text-txt-secondary"
                >
                  <Check size={14} className="text-brand shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/login"
              className="w-full flex items-center justify-center bg-brand text-white rounded-full px-6 py-3 text-sm font-bold hover:bg-brand-hover transition-colors active:scale-[0.97]"
            >
              무료로 시작하기
            </Link>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            variants={fadeUp}
            className="border-2 border-brand rounded-xl p-8 flex flex-col relative"
          >
            <h3 className="text-lg font-bold text-txt-primary mb-2">
              {proPlan.name}
            </h3>
            <p className="text-3xl font-extrabold text-txt-primary mb-1">
              {proPlan.price}
            </p>
            <p className="text-xs text-txt-tertiary mb-6">{proPlan.period}</p>

            <ul className="space-y-3 flex-1 mb-8">
              {proPlan.features.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2.5 text-sm text-txt-secondary"
                >
                  <Check size={14} className="text-txt-tertiary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {/* 얼리버드 대기자 = Free 가입 → PostHog signup_initiated 이벤트로 수요 측정.
                Pro 결제 붙기 전까지는 별도 페이지 대신 동일 진입으로 모아본다. */}
            <Link
              href="/login?next=/dashboard&plan=pro"
              className="w-full flex items-center justify-center bg-brand text-white rounded-full px-6 py-3 text-sm font-bold hover:bg-brand-hover transition-colors active:scale-[0.97]"
            >
              얼리버드 대기 등록
            </Link>
          </motion.div>
        </motion.div>

        {/* 기관 문의 CTA — 대학·산학협력단·창업지원단 대상 별도 계약 경로 */}
        <motion.div
          className="mt-16 max-w-3xl mx-auto"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          <div className="bg-surface-bg border border-border rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-brand mb-1">
                대학·기관 담당자
              </p>
              <h3 className="text-[18px] font-bold text-txt-primary mb-2 break-keep">
                캠퍼스 전체 동아리 운영을 한 번에
              </h3>
              <p className="text-[13px] text-txt-secondary leading-relaxed break-keep">
                학교 이메일(@*.ac.kr) 자동 인증, 감사 로그, 기관별 리포트,
                개인정보 처리 위탁 계약까지 준비됐습니다.
              </p>
            </div>
            <Link
              href="mailto:institution@dailydraft.me?subject=%5B%EA%B8%B0%EA%B4%80%5D%20Draft%20%EB%8F%84%EC%9E%85%20%EB%AC%B8%EC%9D%98"
              className="shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-surface-inverse text-txt-inverse rounded-full px-6 py-3 text-sm font-bold hover:opacity-90 transition-opacity active:scale-[0.97]"
            >
              기관 문의
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
