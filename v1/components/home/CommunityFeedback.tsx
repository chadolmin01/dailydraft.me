'use client'

import React from 'react'
import { MessageSquare, Users, Rocket } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { SectionLabel, SectionTitle } from './shared'

const scenarios = [
  {
    icon: MessageSquare,
    label: 'AI 온보딩',
    title: '1분 대화로 프로필 완성',
    description: 'AI와 짧은 대화를 나누면 기술 스택, 관심 분야, 파운더 유형까지 자동으로 분석해 프로필이 만들어집니다.',
    color: 'bg-brand/10 text-brand border-brand/20',
  },
  {
    icon: Users,
    label: '팀 매칭',
    title: '비전이 맞는 팀원 발견',
    description: '스킬뿐 아니라 방향성과 비전을 분석해서, 정말 잘 맞을 사람과 프로젝트를 연결합니다.',
    color: 'bg-status-success-bg text-indicator-online border-indicator-online/20',
  },
  {
    icon: Rocket,
    label: '팀빌딩',
    title: '커피챗으로 가볍게 시작',
    description: '관심 있는 프로젝트에 커피챗을 보내고, 수락되면 연락처가 공개됩니다. 부담 없이 만나보세요.',
    color: 'bg-indicator-premium/10 text-indicator-premium-border border-indicator-premium-border/20',
  },
]

export const CommunityFeedback: React.FC = () => {
  return (
    <section className="w-full py-20 px-6 md:px-10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <SectionLabel>HOW DRAFT WORKS</SectionLabel>
          <SectionTitle>이런 경험을 할 수 있습니다</SectionTitle>
        </div>

        {/* Scenario Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {scenarios.map((s, i) => {
            const Icon = s.icon
            return (
              <ScrollReveal key={s.label} delay={i * 0.1}>
                <div className="bg-surface-card rounded-xl border border-border p-6 h-full flex flex-col">
                  <div className={`w-10 h-10 rounded-xl ${s.color} border flex items-center justify-center mb-4`}>
                    <Icon size={20} />
                  </div>
                  <div className="text-[10px] font-mono text-txt-tertiary mb-1.5">{s.label}</div>
                  <h3 className="text-base font-bold text-txt-primary mb-2">{s.title}</h3>
                  <p className="text-sm text-txt-secondary leading-relaxed break-keep flex-1">
                    {s.description}
                  </p>
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
