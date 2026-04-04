'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Users, Search, Coffee, Lightbulb, ArrowRight, Check, Lock, Sparkles } from 'lucide-react'
import { SectionLabel, SectionTitle } from './shared'

const tabs = [
  {
    id: 'onboarding',
    label: 'AI 온보딩',
    icon: MessageSquare,
    title: '몇 가지 질문으로\n완성되는 프로필',
    description: '기본 정보를 입력하고 인터랙티브 질문에 답하면, 팀 성향·소통 스타일·강점까지 자동으로 분석해 프로필을 만들어줍니다.',
    bullets: [
      '기술 스택, 관심 분야 선택',
      '팀 성향·소통 스타일 분석',
      'AI 강점 분석 및 추천 분야 생성',
    ],
    cta: '프로필 만들기',
    ctaHref: '/login',
  },
  {
    id: 'matching',
    label: 'AI 매칭',
    icon: Users,
    title: '비전이 맞는 팀을\n찾아줘요',
    description: '프로필과 프로젝트를 분석해서, 정말 잘 맞을 사람과 프로젝트를 추천합니다. 스킬뿐 아니라 방향성도 봅니다.',
    bullets: [
      '스킬 + 비전 기반 매칭 알고리즘',
      '매칭 점수와 이유를 투명하게 공개',
      '프로필 업데이트 시 추천 갱신',
    ],
    cta: '매칭 받아보기',
    ctaHref: '/login',
  },
  {
    id: 'explore',
    label: '탐색 & 발견',
    icon: Search,
    title: '프로젝트와 사람을\n한눈에',
    description: '지금 진행 중인 프로젝트를 탐색하고, 관심 분야의 사람들을 발견하세요. 필터와 검색으로 빠르게 찾을 수 있어요.',
    bullets: [
      '관심 태그·역할·분야별 필터',
      '프로젝트와 사람 탭 전환',
      '최신 프로젝트 피드',
    ],
    cta: '둘러보기',
    ctaHref: '/explore',
  },
  {
    id: 'coffeechat',
    label: '커피챗',
    icon: Coffee,
    title: '가볍게 만나서\n확인하기',
    description: '마음에 드는 팀이나 사람에게 커피챗을 신청하세요. 수락되면 연락처가 공개되고, 가볍게 만나볼 수 있어요.',
    bullets: [
      '한 줄 메시지로 간편 신청',
      '수락 시 연락처 자동 공개',
      '커피챗 히스토리 관리',
    ],
    cta: '커피챗 시작하기',
    ctaHref: '/login',
  },
  {
    id: 'ideation',
    label: '아이디어 검증',
    icon: Lightbulb,
    title: 'AI가 아이디어를\n검증해줘요',
    description: '아이디어를 입력하면 개발자·디자이너·투자자 3가지 관점에서 AI가 분석합니다.',
    bullets: [
      '3가지 페르소나 기반 AI 검증',
      '검증 결과 → PRD 자동 생성',
      '사업계획서 템플릿 + PDF 내보내기',
    ],
    cta: '곧 공개',
    ctaHref: '#',
    comingSoon: true,
  },
]

/* ── Mockup UIs ── */

const OnboardingMockup = () => (
  <div className="space-y-4">
    {/* Progress */}
    <div className="flex items-center gap-2">
      <div className="flex gap-1 flex-1">
        {[0,1,2,3,4].map(i => (
          <div key={i} className={`flex-1 h-1 rounded-full ${i <= 2 ? 'bg-surface-inverse' : 'bg-surface-sunken'}`} />
        ))}
      </div>
      <span className="text-[10px] font-mono text-txt-tertiary shrink-0">3 / 5</span>
    </div>

    {/* Question */}
    <div className="space-y-2">
      <p className="text-[13px] font-bold text-txt-primary">Draft에서 무엇을 하고 싶으세요?</p>
      <div className="space-y-1.5">
        {[
          { label: '팀원 구하기', selected: true },
          { label: '프로젝트 찾기', selected: false },
          { label: '네트워킹', selected: false },
        ].map(({ label, selected }) => (
          <div
            key={label}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-colors ${
              selected
                ? 'border-brand bg-brand/5'
                : 'border-border bg-surface-card'
            }`}
          >
            <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
              selected ? 'border-brand bg-brand' : 'border-border'
            }`}>
              {selected && <div className="w-1.5 h-1.5 rounded-full bg-surface-card" />}
            </div>
            <span className={`text-xs font-medium ${selected ? 'text-txt-primary' : 'text-txt-secondary'}`}>{label}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Next hint */}
    <div className="flex items-center gap-2 px-3 py-2.5 bg-brand/5 border border-brand-border rounded-xl">
      <Sparkles size={12} className="text-brand shrink-0" />
      <div>
        <div className="text-[10px] font-bold text-brand">다음: 성향 인터뷰</div>
        <div className="text-[10px] text-txt-tertiary">팀 스타일·소통 방식·강점을 파악해요</div>
      </div>
    </div>
  </div>
)

const MatchingMockup = () => (
  <div className="space-y-3">
    <div className="flex items-center justify-between mb-1">
      <span className="text-[11px] font-bold text-txt-primary">AI 추천 팀원</span>
      <span className="text-[10px] text-txt-tertiary font-mono">2명 매칭됨</span>
    </div>
    {[
      { initials: '김지', name: '김지현', role: '프론트엔드 · React', score: 92, tags: ['AI', 'LLM'], color: 'bg-blue-100 text-blue-600' },
      { initials: '박수', name: '박수진', role: 'PM · 비즈니스', score: 85, tags: ['에듀테크', '소셜'], color: 'bg-purple-100 text-purple-600' },
    ].map((match) => (
      <div key={match.name} className="bg-surface-card border border-border rounded-xl p-3.5">
        <div className="flex items-center gap-3 mb-2.5">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${match.color}`}>
            {match.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-txt-primary">{match.name}</div>
            <div className="text-[10px] text-txt-tertiary">{match.role}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-base font-black text-brand">{match.score}%</div>
            <div className="text-[9px] text-txt-tertiary">매칭</div>
          </div>
        </div>
        <div className="h-1 bg-surface-sunken rounded-full overflow-hidden mb-2">
          <div className="h-full bg-brand rounded-full" style={{ width: `${match.score}%` }} />
        </div>
        <div className="flex gap-1">
          {match.tags.map(t => (
            <span key={t} className="text-[10px] px-2 py-0.5 bg-brand/8 text-brand rounded-full font-medium border border-brand-border">{t}</span>
          ))}
          <span className="text-[10px] px-2 py-0.5 bg-status-success-bg text-status-success-text rounded-full font-medium">잘 맞음</span>
        </div>
      </div>
    ))}
  </div>
)

const ExploreMockup = () => (
  <div className="space-y-3">
    {/* Search bar */}
    <div className="flex items-center gap-2 px-3 py-2 bg-surface-sunken rounded-xl border border-border">
      <Search size={13} className="text-txt-tertiary shrink-0" />
      <span className="text-xs text-txt-tertiary">프로젝트, 사람 검색...</span>
    </div>
    {/* Tabs */}
    <div className="flex gap-1.5">
      <span className="px-3 py-1.5 bg-surface-inverse text-txt-inverse rounded-full text-[11px] font-bold">프로젝트</span>
      <span className="px-3 py-1.5 border border-border text-txt-tertiary rounded-full text-[11px] font-medium">사람</span>
    </div>
    {/* Cards */}
    <div className="grid grid-cols-2 gap-2">
      {[
        { title: 'AI 이력서 분석', tag: 'AI/ML', members: 2 },
        { title: '캠퍼스 스터디 매칭', tag: '에듀테크', members: 3 },
        { title: '대학생 사이드 프로젝트', tag: '소셜', members: 1 },
        { title: '학식 알리미 앱', tag: '라이프', members: 4 },
      ].map((p) => (
        <div key={p.title} className="bg-surface-card border border-border rounded-xl p-3 space-y-2">
          <div className="text-[11px] font-bold text-txt-primary leading-snug line-clamp-2">{p.title}</div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] px-2 py-0.5 bg-surface-sunken text-txt-tertiary rounded-full">{p.tag}</span>
            <span className="text-[10px] text-txt-tertiary">{p.members}명</span>
          </div>
        </div>
      ))}
    </div>
  </div>
)

const CoffeeChatMockup = () => (
  <div className="space-y-3">
    {/* Request card */}
    <div className="bg-surface-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-surface-sunken rounded-full flex items-center justify-center text-xs font-bold text-txt-secondary shrink-0">이디</div>
        <div>
          <div className="text-sm font-bold text-txt-primary">이디자인</div>
          <div className="text-[10px] text-txt-tertiary">디자이너 · Figma · 3년</div>
        </div>
        <div className="ml-auto shrink-0">
          <div className="w-2 h-2 rounded-full bg-indicator-online" />
        </div>
      </div>
      <div className="bg-surface-sunken rounded-xl px-3 py-2.5 text-xs text-txt-secondary leading-relaxed">
        &ldquo;안녕하세요! 프로젝트 보고 관심이 생겼어요. 가볍게 얘기 나눠볼 수 있을까요?&rdquo;
      </div>
      <div className="flex gap-2">
        <button className="flex-1 py-2 bg-brand text-txt-inverse rounded-full text-[11px] font-bold">수락하기</button>
        <button className="flex-1 py-2 border border-border text-txt-tertiary rounded-full text-[11px] font-medium">나중에</button>
      </div>
    </div>
    {/* Status stepper */}
    <div className="flex items-center px-2">
      {['신청', '수락', '연락처 공개'].map((step, i) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center gap-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
              i === 0 ? 'bg-surface-inverse text-txt-inverse' : i === 1 ? 'bg-brand text-txt-inverse' : 'bg-surface-sunken text-txt-disabled'
            }`}>
              {i < 1 ? <Check size={10} /> : i + 1}
            </div>
            <span className={`text-[9px] font-mono whitespace-nowrap ${i <= 1 ? 'text-txt-primary font-bold' : 'text-txt-disabled'}`}>{step}</span>
          </div>
          {i < 2 && (
            <div className={`flex-1 h-px mb-4 mx-1 ${i === 0 ? 'bg-brand' : 'bg-border'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  </div>
)

const IdeationMockup = () => (
  <div className="relative space-y-3 opacity-60 pointer-events-none select-none">
    <div className="bg-surface-card border border-border rounded-xl p-4 space-y-3">
      <div className="text-[10px] font-mono text-txt-tertiary">아이디어 입력</div>
      <div className="text-sm text-txt-secondary">&ldquo;대학생 맞춤 AI 스터디 플래너&rdquo;</div>
      <div className="h-px bg-border" />
      <div className="space-y-2">
        {[
          { persona: 'Developer', score: 'A', color: 'bg-brand/10 text-brand' },
          { persona: 'Designer', score: 'B+', color: 'bg-status-success-bg text-status-success-text' },
          { persona: 'Investor', score: 'A-', color: 'bg-indicator-premium/10 text-indicator-premium-border' },
        ].map((p) => (
          <div key={p.persona} className="flex items-center justify-between">
            <span className="text-xs text-txt-secondary">{p.persona}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.color}`}>{p.score}</span>
          </div>
        ))}
      </div>
    </div>
    {/* Coming soon overlay */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="bg-surface-card border border-border rounded-full px-4 py-2 flex items-center gap-2 shadow-sm">
        <Lock size={12} className="text-txt-tertiary" />
        <span className="text-xs font-bold text-txt-secondary">곧 공개될 예정이에요</span>
      </div>
    </div>
  </div>
)

const mockups: Record<string, React.FC> = {
  onboarding: OnboardingMockup,
  matching: MatchingMockup,
  explore: ExploreMockup,
  coffeechat: CoffeeChatMockup,
  ideation: IdeationMockup,
}

export const FeatureShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const autoTabCount = tabs.filter(t => !('comingSoon' in t && t.comingSoon)).length

  const next = useCallback(() => {
    setActiveTab((prev) => (prev + 1) % autoTabCount)
  }, [autoTabCount])

  useEffect(() => {
    if (paused) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [paused, next])

  const handleTabClick = (index: number) => {
    setActiveTab(index)
    setPaused(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setPaused(false), 10000)
  }

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  const tab = tabs[activeTab]
  const Mockup = mockups[tab.id]

  return (
    <section id="features" className="w-full py-16 px-6 md:px-10 relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface-card via-surface-sunken/40 to-surface-card pointer-events-none" />

      <div className="max-w-5xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-12">
          <SectionLabel>FEATURES</SectionLabel>
          <SectionTitle>Draft가 해주는 일</SectionTitle>
        </div>

        {/* Tab bar */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {tabs.map((t, i) => (
            <button
              key={t.id}
              onClick={() => handleTabClick(i)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
                i === activeTab
                  ? 'bg-surface-inverse text-txt-inverse shadow-sm scale-105'
                  : 'text-txt-tertiary hover:text-txt-primary hover:bg-surface-sunken border border-transparent hover:border-border'
              }`}
            >
              <t.icon size={13} />
              {t.label}
              {'comingSoon' in t && t.comingSoon && (
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
                  i === activeTab ? 'bg-surface-card/20 text-txt-inverse/70' : 'bg-surface-sunken text-txt-disabled border border-border'
                }`}>SOON</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {/* Left: Description */}
            <div className="flex flex-col order-2 lg:order-1">
              {/* Feature label */}
              <div className="inline-flex items-center gap-2 mb-5 w-fit">
                <div className="w-8 h-8 bg-brand/10 rounded-xl flex items-center justify-center shrink-0">
                  <tab.icon size={16} className="text-brand" />
                </div>
                <span className="text-xs font-bold text-brand tracking-wider uppercase">{tab.label}</span>
              </div>

              <h3 className="text-2xl md:text-[28px] font-black text-txt-primary mb-4 leading-[1.2] whitespace-pre-line">
                {tab.title}
              </h3>
              <p className="text-sm text-txt-secondary leading-relaxed mb-7 break-keep">
                {tab.description}
              </p>

              <ul className="space-y-3 mb-8">
                {tab.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-sm text-txt-secondary">
                    <div className="w-5 h-5 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                      <Check size={10} className="text-brand" />
                    </div>
                    {b}
                  </li>
                ))}
              </ul>

              {'comingSoon' in tab && tab.comingSoon ? (
                <span className="flex items-center gap-2 text-sm font-bold text-txt-disabled w-fit">
                  <Lock size={14} />
                  {tab.cta}
                </span>
              ) : (
                <Link
                  href={tab.ctaHref}
                  className="group w-fit flex items-center gap-2 px-5 py-2.5 bg-surface-inverse text-txt-inverse rounded-full text-sm font-bold hover:opacity-80 transition-all duration-200 active:scale-[0.97]"
                >
                  {tab.cta}
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>

            {/* Right: App window mockup */}
            <div className="relative order-1 lg:order-2">
              {/* Glow */}
              <div className="absolute inset-4 bg-brand/8 rounded-3xl blur-2xl -z-10" />

              <div className="rounded-2xl overflow-hidden shadow-xl border border-border bg-surface-card">
                {/* Browser chrome */}
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-surface-sunken/60">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                  <div className="ml-auto flex items-center gap-1.5 bg-surface-card rounded-md px-3 py-1 border border-border">
                    <div className="w-1.5 h-1.5 rounded-full bg-indicator-online" />
                    <span className="text-[10px] text-txt-tertiary font-mono">draft.im</span>
                  </div>
                </div>

                {/* Mockup content */}
                <div className="p-5 min-h-[280px] flex flex-col justify-center">
                  <Mockup />
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-12">
          {tabs.filter(t => !('comingSoon' in t && t.comingSoon)).map((_, i) => (
            <button
              key={i}
              onClick={() => handleTabClick(i)}
              className={`rounded-full transition-all duration-300 ${
                i === activeTab
                  ? 'w-6 h-2 bg-surface-inverse'
                  : 'w-2 h-2 bg-border hover:bg-txt-tertiary'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
