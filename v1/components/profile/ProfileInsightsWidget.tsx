'use client'

import { useQuery } from '@tanstack/react-query'
import { Eye, TrendingUp, Target } from 'lucide-react'

/**
 * `<ProfileInsightsWidget>` — 프로필 소유자에게 조회수·매칭 가능 프로젝트 수를 보여 줌.
 *
 * 배경: profile_views 가 DB 에 쌓이지만 화면 어디에도 안 보여서 "누가 내 프로필 봤나" 궁금증 해소 못 함.
 * /api/profile/insights 는 이미 profile_views + matchedOpportunities + profileStrength 반환 중.
 * 이 컴포넌트는 단순히 그걸 시각화.
 *
 * /profile 의 About 탭에 PersonalityScorecard 아래로 배치 예정.
 */

interface Insights {
  profileViews: number
  matchedOpportunities: number
  profileStrength: number
  averageMatchScore: number
}

export function ProfileInsightsWidget() {
  const { data, isLoading } = useQuery<Insights>({
    queryKey: ['profile-insights'],
    queryFn: async () => {
      const res = await fetch('/api/profile/insights')
      if (!res.ok) throw new Error('failed')
      const body = await res.json()
      return body.data ?? body
    },
    staleTime: 1000 * 60 * 5,
  })

  if (isLoading) {
    return (
      <div className="bg-surface-card border border-border rounded-2xl p-5 h-[110px] animate-pulse" />
    )
  }
  if (!data) return null

  const cards: Array<{
    icon: React.ComponentType<{ size?: number; className?: string }>
    label: string
    value: string | number
    hint: string
  }> = [
    {
      icon: Eye,
      label: '프로필 조회',
      value: data.profileViews,
      hint: '공개 프로필을 본 사람 수 (최근 30일)',
    },
    {
      icon: Target,
      label: '매칭 가능 프로젝트',
      value: data.matchedOpportunities,
      hint: '관심사가 겹치는 모집 중 프로젝트',
    },
    {
      icon: TrendingUp,
      label: '매칭 점수 평균',
      value: `${data.averageMatchScore}%`,
      hint: '내 프로필 기반 추정 매칭률',
    },
  ]

  return (
    <section
      aria-labelledby="profile-insights-title"
      className="bg-surface-card border border-border rounded-2xl p-5"
    >
      <h2
        id="profile-insights-title"
        className="text-[13px] font-bold text-txt-tertiary mb-3 flex items-center gap-1.5"
      >
        내 프로필 인사이트
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {cards.map(card => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="bg-surface-sunken rounded-xl p-3"
              title={card.hint}
            >
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-txt-tertiary uppercase tracking-wider mb-1">
                <Icon size={10} aria-hidden="true" />
                {card.label}
              </div>
              <p className="text-[18px] font-bold text-txt-primary tabular-nums">
                {card.value}
              </p>
            </div>
          )
        })}
      </div>
      <p className="text-[11px] text-txt-tertiary mt-3 leading-relaxed">
        프로필·스킬·관심사를 꾸준히 업데이트하실수록 조회수와 매칭 정확도가 올라갑니다.
      </p>
    </section>
  )
}
