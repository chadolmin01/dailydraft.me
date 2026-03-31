'use client'

import React from 'react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { SectionLabel, SectionTitle, AnimatedCounter } from './shared'

const testimonials = [
  {
    name: '김도연',
    school: '연세대 경영학과',
    role: 'PM',
    avatar: 'D',
    quote: '프로젝트 올린 지 이틀 만에 개발자 두 분에게 커피챗이 왔어요. AI 매칭 점수가 높은 분들이라 실제로 만나보니 정말 잘 맞았습니다.',
  },
  {
    name: '이서준',
    school: 'KAIST 전산학부',
    role: '풀스택 개발자',
    avatar: 'S',
    quote: 'AI 온보딩이 제 기술 스택을 잘 파악해줬어요. 추천받은 프로젝트 중 하나에 합류해서 지금 MVP 개발 중입니다.',
  },
  {
    name: '박하은',
    school: '고려대 디자인학과',
    role: 'UX 디자이너',
    avatar: 'H',
    quote: '디자이너가 필요한 프로젝트를 쉽게 찾을 수 있어서 좋았어요. 커피챗으로 가볍게 만나본 후 팀에 합류했습니다.',
  },
]

const stats = [
  { label: '평균 매칭 정확도', value: 87, suffix: '%' },
  { label: '첫 커피챗까지 평균', value: 3, suffix: '일' },
  { label: '팀빌딩 성공률', value: 72, suffix: '%' },
]

export const CommunityFeedback: React.FC = () => {
  return (
    <section className="w-full py-20 px-6 md:px-10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <SectionLabel>COMMUNITY</SectionLabel>
          <SectionTitle>실제 사용자들의 이야기</SectionTitle>
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {testimonials.map((t, i) => (
            <ScrollReveal key={t.name} delay={i * 0.1}>
              <div className="bg-surface-card rounded-xl border border-border p-5 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center text-brand text-sm font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-txt-primary">{t.name}</div>
                    <div className="text-[10px] text-txt-tertiary">{t.school} · {t.role}</div>
                  </div>
                </div>
                <p className="text-sm text-txt-secondary leading-relaxed break-keep flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Stats */}
        <ScrollReveal delay={0.3}>
          <div className="grid grid-cols-3 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-surface-sunken rounded-xl p-6 text-center">
                <div className="text-2xl md:text-3xl font-bold text-txt-primary mb-1">
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                </div>
                <div className="text-xs text-txt-tertiary">{s.label}</div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
