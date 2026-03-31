'use client'

import React, { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { AnimatedCounter } from './shared'

interface HeroProps {
  onCtaClick: () => void
}

/* ── Floating UI Cards (lg only) ── */
const FloatingCard: React.FC<{
  children: React.ReactNode
  className?: string
  delay?: number
}> = ({ children, className = '', delay = 0 }) => (
  <motion.div
    className={`absolute hidden lg:block bg-surface-card/95 backdrop-blur-sm rounded-xl border border-border shadow-md p-4 ${className}`}
    animate={{ y: [0, -8, 0] }}
    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay }}
  >
    {children}
  </motion.div>
)

interface PublicStats {
  users: number
  projects: number
  coffeeChats: number
}

export const Hero: React.FC<HeroProps> = ({ onCtaClick }) => {
  const [stats, setStats] = useState<PublicStats | null>(null)

  useEffect(() => {
    fetch('/api/stats/public')
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})
  }, [])

  // 최소 표시 기준: 사용자 50명 이상이어야 stats bar 노출 (초기엔 낮은 숫자가 역효과)
  const showStats = stats && stats.users >= 50

  return (
    <section className="relative w-full pt-16 sm:pt-24 pb-16 sm:pb-24 px-4 sm:px-6 md:px-10 max-w-6xl mx-auto">

      {/* Floating UI Cards — desktop only */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Card 1: Mini onboarding chat preview */}
        <FloatingCard className="top-24 -left-4 w-56" delay={0}>
          <div className="text-[10px] font-mono text-txt-tertiary mb-2">AI 온보딩</div>
          <div className="space-y-2">
            <div className="bg-surface-sunken rounded-lg px-3 py-1.5 text-xs text-txt-secondary w-fit">
              어떤 프로젝트에 관심 있어요?
            </div>
            <div className="bg-brand/10 rounded-lg px-3 py-1.5 text-xs text-brand w-fit ml-auto">
              AI 기반 서비스요!
            </div>
            <div className="bg-surface-sunken rounded-lg px-3 py-1.5 text-xs text-txt-secondary w-fit">
              프로필 생성 중...
            </div>
          </div>
        </FloatingCard>

        {/* Card 2: AI Match preview */}
        <FloatingCard className="top-32 -right-8 w-52" delay={1.5}>
          <div className="text-[10px] font-mono text-txt-tertiary mb-2">AI 매칭</div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-brand/10 rounded-full flex items-center justify-center text-brand text-xs font-bold">JK</div>
            <div>
              <div className="text-xs font-bold">김지현</div>
              <div className="text-[10px] text-txt-tertiary">프론트엔드 · React</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-txt-tertiary">스킬 · 비전 기반 분석</span>
          </div>
        </FloatingCard>

        {/* Card 3: Coffee chat request */}
        <FloatingCard className="bottom-16 left-8 w-48" delay={3}>
          <div className="text-[10px] font-mono text-txt-tertiary mb-2">커피챗</div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-surface-sunken rounded-full flex items-center justify-center text-[10px] font-bold">P</div>
            <span className="text-xs font-medium">박수진</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-indicator-online rounded-full"></div>
            <span className="text-[10px] text-status-success-text font-medium">수락됨</span>
          </div>
        </FloatingCard>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center mt-10 sm:mt-16 md:mt-24 max-w-2xl mx-auto">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.15] mb-5 text-txt-primary">
          사이드 프로젝트 팀빌딩,
          <br />
          <span className="text-brand">AI가 대신 해줄게.</span>
        </h1>

        <p className="text-sm md:text-base text-txt-secondary mb-8 max-w-xl leading-relaxed break-keep">
          프로필만 입력하면 AI가 분석하고,
          <br className="hidden md:inline" />
          비전이 맞는 팀원을 찾아줍니다.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mb-12">
          <button
            onClick={onCtaClick}
            className="group w-full sm:w-auto flex items-center justify-center gap-2 bg-brand text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-brand-hover transition-all duration-200 active:scale-[0.97] shadow-sm"
          >
            시작하기 — 1분이면 끝
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
            className="group w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-sm border border-border bg-surface-card text-txt-secondary hover:bg-surface-sunken transition-all duration-200"
          >
            프로젝트 둘러보기
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Real stats from DB — only show when data loaded and non-zero */}
        {showStats && (
          <div className="flex items-center gap-6 sm:gap-10 text-center">
            <div>
              <div className="text-xl sm:text-2xl font-bold text-txt-primary">
                <AnimatedCounter target={stats.users} suffix="명" />
              </div>
              <div className="text-[10px] font-mono text-txt-tertiary mt-1">가입한 사용자</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <div className="text-xl sm:text-2xl font-bold text-txt-primary">
                <AnimatedCounter target={stats.projects} suffix="개" />
              </div>
              <div className="text-[10px] font-mono text-txt-tertiary mt-1">등록된 프로젝트</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <div className="text-xl sm:text-2xl font-bold text-txt-primary">
                <AnimatedCounter target={stats.coffeeChats} suffix="회" />
              </div>
              <div className="text-[10px] font-mono text-txt-tertiary mt-1">커피챗</div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
