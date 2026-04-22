'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

/**
 * InstitutionCTA — 학교·기관(B2B) 전용 CTA 섹션
 *
 * 메모 근거:
 *   landing_redesign_2026-04-20.md — "기관 오디언스 0%" 갭 해소
 *   positioning_three_layers.md    — 3층(셋업 지원) 설명
 *   enterprise_roadmap_2026-04-20.md — PIPA 위탁, 감사로그, 데이터권리
 *
 * 원칙:
 *   - 가짜 통계·실적 숫자 금지 (검증 전)
 *   - 합쇼체
 *   - 아이콘·그라디언트 라인 없음 — 텍스트 위계로만 구분
 *   - 연락처는 team@dailydraft.me 로 통일, subject 파라미터로 라우팅
 */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

interface CtaLink {
  label: string
  href: string
  primary?: boolean
}

const CTAS: CtaLink[] = [
  {
    label: '기관 도입 상세 보기',
    href: '/enterprise',
    primary: true,
  },
  {
    label: '실사 자료 요청',
    href: 'mailto:team@dailydraft.me?subject=Due%20Diligence%20Docs',
  },
  {
    label: '신뢰 센터',
    href: '/trust',
  },
]

export const InstitutionCTA: React.FC = () => {
  return (
    <section
      id="institutions"
      aria-labelledby="institutions-title"
      className="w-full px-4 sm:px-6 lg:px-8 py-20 sm:py-24"
    >
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="rounded-3xl bg-surface-sunken border border-border px-6 sm:px-10 lg:px-16 py-14 sm:py-20"
        >
          <motion.span
            variants={fadeUp}
            lang="en"
            className="text-[10px] font-mono uppercase tracking-wider text-txt-tertiary block mb-3"
          >
            For Institutions
          </motion.span>

          <motion.h2
            id="institutions-title"
            variants={fadeUp}
            className="text-2xl md:text-3xl lg:text-4xl font-bold text-txt-primary tracking-tight mb-6 max-w-2xl break-keep"
          >
            학교·기관을 위한 Draft
          </motion.h2>

          <motion.div
            variants={fadeUp}
            className="text-[15px] sm:text-base text-txt-secondary leading-[1.75] max-w-2xl space-y-3 mb-10 break-keep"
          >
            <p>
              산하 동아리의 운영 데이터가 학교·기관 대시보드 한곳으로 집계됩니다.
              활동 보고·예산 정산·성과 집계를 분기마다 수작업할 필요가 없습니다.
            </p>
            <p>
              개인정보는 한국 PIPA 위탁 계약 기준으로 처리합니다.
              수집·이용·보관·제3자·파기·정보주체 권리까지 문서화되어 있어,
              산학협력단·감사 부서 실사에 바로 대응 가능합니다.
            </p>
            <p>
              카톡·Slack·Discord·GitHub 등 현재 쓰는 도구를 그대로 연결합니다.
              학생 운영진에게 새 도구를 강요하지 않아, 도입 시 운영 부하가 늘지 않습니다.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
          >
            {CTAS.map((cta) =>
              cta.primary ? (
                <Link
                  key={cta.label}
                  href={cta.href}
                  className="group inline-flex items-center justify-center gap-1.5 bg-surface-inverse text-txt-inverse px-6 py-3 rounded-full font-semibold text-[14px] ob-press-spring hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  {cta.label}
                  <ArrowRight
                    size={14}
                    aria-hidden="true"
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </Link>
              ) : (
                <Link
                  key={cta.label}
                  href={cta.href}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold text-[14px] text-txt-secondary bg-surface-card border border-border hover:bg-surface-card hover:text-txt-primary transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  {cta.label}
                </Link>
              ),
            )}
          </motion.div>

          <motion.p
            variants={fadeUp}
            className="text-[12px] text-txt-tertiary mt-6"
          >
            문의·실사 문서 요청 모두 team@dailydraft.me 로 직접 연결됩니다.
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}
