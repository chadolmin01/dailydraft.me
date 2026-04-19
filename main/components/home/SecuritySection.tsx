'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Shield,
  Lock,
  ScrollText,
  Database,
  FileCheck,
  Activity,
  ArrowRight,
} from 'lucide-react'

/**
 * 보안·투명성 섹션 — 엔터프라이즈 P0/P1 성과 노출.
 * 대학/기관 실사 전 방문자에게 "준비된 파트너" 포지셔닝.
 *
 * 의도적으로 과장된 배지(SOC2/ISO27001) 금지 — 실제 취득 전엔 oversell 방지.
 * 검증 가능한 실제 구현만 선언.
 */

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
}

interface PillarItem {
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  desc: string
}

const PILLARS: PillarItem[] = [
  {
    icon: Shield,
    title: '개인정보보호법(PIPA) 준수',
    desc: '수집·이용·보관·제3자·파기·권리 명시. 정보주체 열람·삭제권 이행 절차 상시 운영.',
  },
  {
    icon: Lock,
    title: 'Row Level Security',
    desc: '모든 민감 테이블에 Postgres RLS 적용. 클럽·기관 간 데이터 격리를 DB 레벨에서 보장.',
  },
  {
    icon: ScrollText,
    title: '감사 로그',
    desc: '운영진 주요 액션(역할 변경·삭제·공개 전환 등)을 append-only 로 3년 보존. 실사 대응.',
  },
  {
    icon: Database,
    title: '주간 백업 + 복구 리허설',
    desc: '매주 자동 pg_dump. 복구 절차 runbook 문서화, 분기별 스테이징 리허설.',
  },
  {
    icon: FileCheck,
    title: '데이터 삭제권',
    desc: '탈퇴 요청 시 30일 유예 후 자동 영구 삭제. JSON 형태 본인 데이터 전체 다운로드 제공.',
  },
  {
    icon: Activity,
    title: '실시간 장애 투명성',
    desc: '공개 시스템 상태 페이지에서 DB·인증 헬스체크 즉시 확인. 5xx 에러는 운영 채널 자동 알림.',
  },
]

export const SecuritySection: React.FC = () => {
  return (
    <section
      id="security"
      className="w-full py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-surface-bg border-y border-border"
    >
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Header */}
          <motion.div variants={fadeUp} className="text-center mb-14">
            <p className="text-[13px] font-semibold text-brand mb-3">
              신뢰·투명성
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-txt-primary mb-4 break-keep">
              대학과 기관이 요구하는
              <br className="hidden sm:block" />
              보안 기준을 먼저 갖췄습니다
            </h2>
            <p className="text-[15px] text-txt-secondary leading-relaxed max-w-xl mx-auto break-keep">
              학생 데이터를 맡기려면 그만한 준비가 필요합니다. Draft 는 출시 전부터
              개인정보보호법 준수와 감사 추적, 복구 리허설까지 상시 운영합니다.
            </p>
          </motion.div>

          {/* Grid of pillars */}
          <motion.div
            variants={fadeUp}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {PILLARS.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="flex flex-col items-start p-6 bg-surface-card border border-border rounded-2xl hover:border-brand/40 transition-colors duration-200"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand/8 flex items-center justify-center mb-4">
                    <Icon size={18} className="text-brand" />
                  </div>
                  <h3 className="text-[15px] font-bold text-txt-primary mb-2">
                    {item.title}
                  </h3>
                  <p className="text-[13px] text-txt-secondary leading-relaxed break-keep">
                    {item.desc}
                  </p>
                </div>
              )
            })}
          </motion.div>

          {/* Verifiable links */}
          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              href="/status"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-txt-primary border border-border hover:border-brand/50 px-4 py-2 rounded-full transition-colors"
            >
              시스템 상태 확인
              <ArrowRight size={13} />
            </Link>
            <Link
              href="/privacy"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-txt-secondary hover:text-txt-primary px-4 py-2 rounded-full transition-colors"
            >
              개인정보처리방침
            </Link>
            <Link
              href="/terms"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-txt-secondary hover:text-txt-primary px-4 py-2 rounded-full transition-colors"
            >
              이용약관
            </Link>
            <Link
              href="mailto:institution@dailydraft.me?subject=%5B%EB%B3%B4%EC%95%88%5D%20%EA%B8%B0%EA%B4%80%20%EA%B3%84%EC%95%BD%20%EB%AC%B8%EC%9D%98"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand hover:opacity-80 px-4 py-2 rounded-full transition-opacity"
            >
              기관 계약 문의
              <ArrowRight size={13} />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
