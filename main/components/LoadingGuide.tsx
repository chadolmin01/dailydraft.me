'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Check,
  Circle,
  ArrowRight,
  CheckCircle2,
  Plus,
  Search,
  Users,
  FolderOpen,
  TrendingUp,
  UserPen,
} from 'lucide-react'
import type { Tables } from '@/src/types/database'

/* ─── Types ─── */

interface GuideCTAProps {
  profile: Tables<'profiles'> | null
  completion: {
    fields: { label: string; done: boolean }[]
    completedCount: number
    pct: number
  }
}

interface CTAItem {
  title: string
  primary: { label: string; desc: string; href: string; icon: React.ElementType }
  secondary: { label: string; href: string; icon: React.ElementType }
}

/* ─── CTA Config by situation ─── */

const CTA_CONFIG: Record<string, CTAItem> = {
  has_project: {
    title: '프로젝트를 함께할 팀원을 찾아볼까요?',
    primary: {
      label: '내 프로젝트 등록하기',
      desc: '팀원 모집부터 일정 관리까지 한 곳에서',
      href: '/projects/new',
      icon: Plus,
    },
    secondary: { label: '다른 프로젝트 둘러보기', href: '/explore', icon: FolderOpen },
  },
  want_to_join: {
    title: '나에게 맞는 프로젝트를 찾아볼까요?',
    primary: {
      label: '나에게 맞는 프로젝트 보기',
      desc: '관심 분야와 기술 스택 기반 추천',
      href: '/explore',
      icon: Search,
    },
    secondary: { label: '프로필 완성하기', href: '/profile/edit', icon: UserPen },
  },
  solo: {
    title: '같이 시작할 사람을 찾아볼까요?',
    primary: {
      label: '지금 뜨는 프로젝트 구경하기',
      desc: '이번 주 인기 프로젝트를 확인해보세요',
      href: '/explore',
      icon: TrendingUp,
    },
    secondary: { label: '내 프로젝트 만들기', href: '/projects/new', icon: Plus },
  },
  exploring: {
    title: '어디서부터 시작할지 고민이라면,',
    primary: {
      label: '어떤 사람들이 있는지 보기',
      desc: '다양한 포지션의 사람들을 만나보세요',
      href: '/explore?tab=people',
      icon: Users,
    },
    secondary: { label: '프로젝트 둘러보기', href: '/explore', icon: FolderOpen },
  },
}

/* ─── Component ─── */

export function GuideCTA({ profile, completion }: GuideCTAProps) {
  const [phase, setPhase] = useState<'welcome' | 'cta'>('welcome')

  useEffect(() => {
    const t = setTimeout(() => setPhase('cta'), 1200)
    return () => clearTimeout(t)
  }, [])

  const situation = profile?.current_situation ?? 'exploring'
  const cta = CTA_CONFIG[situation] ?? CTA_CONFIG.exploring
  const nickname = profile?.nickname ?? '회원'
  const showNudge = completion.pct < 100

  const PrimaryIcon = cta.primary.icon
  const SecondaryIcon = cta.secondary.icon

  return (
    <div className="fixed inset-0 z-50 bg-surface-bg bg-grid-engineering flex flex-col items-center justify-center font-sans p-6">
      <div className="w-full max-w-md relative">
        {/* ── Welcome Phase ── */}
        {phase === 'welcome' && (
          <div className="bg-surface-card border border-border-strong shadow-brutal overflow-hidden animate-slide-up-fade">
            <div className="h-28 bg-surface-inverse relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
              <div className="relative z-10 w-14 h-14 bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <CheckCircle2 size={28} className="text-white" />
              </div>
            </div>

            <div className="p-8 text-center">
              <h2 className="text-xl font-bold text-txt-primary mb-1">
                {nickname}님, 준비 완료!
              </h2>
              <p className="text-sm text-txt-secondary">
                이제 Draft를 시작해볼까요?
              </p>
            </div>

            <div className="bg-surface-sunken px-4 py-2 border-t border-border-strong flex justify-between items-center text-[0.5625rem] font-mono text-txt-disabled">
              <span>DRAFT OS v2.4.0</span>
              <span className="flex items-center gap-1.5">
                READY
                <span className="w-1.5 h-1.5 rounded-full bg-indicator-online" />
              </span>
            </div>
          </div>
        )}

        {/* ── CTA Phase ── */}
        {phase === 'cta' && (
          <div className="bg-surface-card border border-border-strong shadow-brutal overflow-hidden animate-slide-up-fade">
            {/* Header */}
            <div className="p-8 pb-6">
              <span className="text-[0.625rem] font-medium text-txt-tertiary">
                NEXT STEP
              </span>
              <h2 className="text-lg font-bold text-txt-primary mt-1.5 break-keep">
                {cta.title}
              </h2>
            </div>

            {/* CTAs */}
            <div className="px-8 pb-6 space-y-3">
              {/* Primary */}
              <Link
                href={cta.primary.href}
                className="block border-2 border-surface-inverse p-4 shadow-solid-sm transition-all hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-black hover:text-white group animate-fade-in"
                style={{ animationDelay: '200ms', animationFillMode: 'both' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <PrimaryIcon size={18} className="shrink-0" />
                    <span className="font-bold text-sm">{cta.primary.label}</span>
                  </div>
                  <ArrowRight size={16} className="shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-txt-disabled group-hover:text-white/60 mt-1.5 ml-[30px]">
                  {cta.primary.desc}
                </p>
              </Link>

              {/* Secondary */}
              <Link
                href={cta.secondary.href}
                className="flex items-center justify-between border border-border-strong p-4 transition-colors hover:bg-surface-sunken group animate-fade-in"
                style={{ animationDelay: '400ms', animationFillMode: 'both' }}
              >
                <div className="flex items-center gap-3">
                  <SecondaryIcon size={18} className="shrink-0 text-txt-tertiary" />
                  <span className="text-sm font-medium text-txt-secondary">{cta.secondary.label}</span>
                </div>
                <ArrowRight size={16} className="shrink-0 text-txt-disabled group-hover:text-txt-secondary transition-colors" />
              </Link>
            </div>

            {/* Profile Nudge */}
            {showNudge && (
              <div
                className="mx-8 mb-6 pt-6 border-t border-dashed border-border animate-fade-in"
                style={{ animationDelay: '600ms', animationFillMode: 'both' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[0.625rem] font-medium text-txt-tertiary">
                    PROFILE
                  </span>
                  <span className="text-[0.625rem] font-mono font-bold text-txt-primary">
                    {completion.pct}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-surface-sunken overflow-hidden mb-3">
                  <div
                    className="h-full bg-brand transition-all duration-500"
                    style={{ width: `${completion.pct}%` }}
                  />
                </div>

                {/* Field checklist */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 mb-4">
                  {completion.fields.map((f) => (
                    <span
                      key={f.label}
                      className="flex items-center gap-1 text-xs text-txt-secondary"
                    >
                      {f.done ? (
                        <Check size={12} className="text-brand" />
                      ) : (
                        <Circle size={12} className="text-txt-disabled" />
                      )}
                      {f.label}
                    </span>
                  ))}
                </div>

                {/* Nudge actions */}
                <div className="flex items-center gap-3">
                  <Link
                    href="/profile/edit"
                    className="text-xs font-bold text-txt-primary underline underline-offset-2 hover:text-brand transition-colors"
                  >
                    프로필 완성하러 가기
                  </Link>
                  <Link
                    href="/explore"
                    className="text-xs text-txt-disabled hover:text-txt-secondary transition-colors"
                  >
                    나중에
                  </Link>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="bg-surface-sunken px-4 py-2 border-t border-border-strong flex justify-between items-center text-[0.5625rem] font-mono text-txt-disabled">
              <span>DRAFT OS v2.4.0</span>
              <span className="flex items-center gap-1.5">
                ONBOARDING
                <Check size={10} />
              </span>
            </div>
          </div>
        )}

        {/* Glow */}
        <div className="absolute -inset-4 bg-gradient-to-r from-brand/10 to-purple-500/10 blur-2xl -z-10" />
      </div>
    </div>
  )
}
