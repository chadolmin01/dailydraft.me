'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Users, Search, Coffee, ArrowRight, Check } from 'lucide-react'
import { SectionLabel, SectionTitle, TabPill } from './shared'

const tabs = [
  {
    id: 'onboarding',
    label: 'AI 온보딩',
    icon: MessageSquare,
    title: '1분 대화로 완성되는 프로필',
    description: 'AI와 짧은 대화만 나누면, 당신의 강점·관심사·파운더 유형까지 자동으로 분석해 프로필을 만들어줍니다.',
    bullets: [
      '기술 스택, 관심 분야 자동 추출',
      '파운더 유형 분석 (빌더·비즈니스·크리에이터)',
      'AI 추천 분야 생성',
    ],
    cta: '프로필 만들기',
  },
  {
    id: 'matching',
    label: 'AI 매칭',
    icon: Users,
    title: '비전이 맞는 팀을 찾아줘요',
    description: '프로필과 프로젝트를 분석해서, 정말 잘 맞을 사람과 프로젝트를 매칭합니다. 스킬뿐 아니라 방향성도 봅니다.',
    bullets: [
      '스킬 + 비전 기반 매칭 알고리즘',
      '매칭 점수와 이유를 투명하게 공개',
      '매주 새로운 추천 업데이트',
    ],
    cta: '매칭 받아보기',
  },
  {
    id: 'explore',
    label: '탐색 & 발견',
    icon: Search,
    title: '프로젝트와 사람을 한눈에',
    description: '지금 진행 중인 프로젝트를 탐색하고, 관심 분야의 사람들을 발견하세요. 필터와 검색으로 빠르게 찾을 수 있어요.',
    bullets: [
      '관심 태그·역할·분야별 필터',
      '프로젝트와 사람 탭 전환',
      '실시간 업데이트 피드',
    ],
    cta: '둘러보기',
  },
  {
    id: 'coffeechat',
    label: '커피챗',
    icon: Coffee,
    title: '가볍게 만나서 확인하기',
    description: '마음에 드는 팀이나 사람에게 커피챗을 신청하세요. 수락되면 연락처가 공개되고, 가볍게 만나볼 수 있어요.',
    bullets: [
      '한 줄 메시지로 간편 신청',
      '수락 시 연락처 자동 공개',
      '커피챗 히스토리 관리',
    ],
    cta: '커피챗 시작하기',
  },
]

/* ── Mockup UIs ── */
const OnboardingMockup = () => (
  <div className="space-y-3">
    <div className="bg-surface-sunken rounded-xl px-4 py-2.5 text-sm text-txt-secondary w-fit max-w-[80%]">
      반갑습니다! 어떤 분야에 관심 있으세요?
    </div>
    <div className="bg-brand/10 rounded-xl px-4 py-2.5 text-sm text-brand w-fit max-w-[80%] ml-auto">
      AI/ML 쪽이요. 최근에 LLM 프로젝트 했어요
    </div>
    <div className="bg-surface-sunken rounded-xl px-4 py-2.5 text-sm text-txt-secondary w-fit max-w-[80%]">
      좋아요! 기술 스택도 알려주세요
    </div>
    <div className="bg-brand/10 rounded-xl px-4 py-2.5 text-sm text-brand w-fit max-w-[80%] ml-auto">
      Python, TypeScript, React
    </div>
    <motion.div
      className="mt-4 bg-surface-card border border-brand-border rounded-xl p-4"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Check size={14} className="text-brand" />
        <span className="text-xs font-bold text-brand">프로필 생성 완료</span>
      </div>
      <div className="text-[10px] text-txt-tertiary">빌더 유형 · AI/ML · 풀스택</div>
    </motion.div>
  </div>
)

const MatchingMockup = () => (
  <div className="space-y-3">
    {[
      { name: '이서준', role: '백엔드 · Python', score: 92, tags: ['AI', 'LLM'] },
      { name: '김하늘', role: 'PM · 비즈니스', score: 85, tags: ['에듀테크', '소셜'] },
    ].map((match) => (
      <div key={match.name} className="bg-surface-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand/10 rounded-full flex items-center justify-center text-brand text-xs font-bold">
              {match.name[0]}
            </div>
            <div>
              <div className="text-sm font-bold">{match.name}</div>
              <div className="text-[10px] text-txt-tertiary">{match.role}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-brand">{match.score}%</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-surface-sunken rounded-full overflow-hidden">
            <div className="h-full bg-brand rounded-full" style={{ width: `${match.score}%` }} />
          </div>
        </div>
        <div className="flex gap-1.5 mt-2">
          {match.tags.map(t => (
            <span key={t} className="text-[10px] px-2 py-0.5 bg-brand-bg text-brand rounded-full font-medium">{t}</span>
          ))}
          <span className="text-[10px] px-2 py-0.5 bg-status-success-bg text-status-success-text rounded-full font-medium">잘 맞는 프로젝트</span>
        </div>
      </div>
    ))}
  </div>
)

const ExploreMockup = () => (
  <div>
    <div className="flex gap-2 mb-3">
      <span className="px-3 py-1 bg-surface-inverse text-txt-inverse rounded-full text-xs font-medium">프로젝트</span>
      <span className="px-3 py-1 border border-border rounded-full text-xs font-medium text-txt-tertiary">사람</span>
    </div>
    <div className="grid grid-cols-2 gap-2">
      {[
        { title: 'AI 이력서 분석', tag: 'AI' },
        { title: '스터디 매칭', tag: '에듀테크' },
        { title: '캠퍼스 중고거래', tag: '커머스' },
        { title: '학식 알리미', tag: '라이프' },
      ].map((p) => (
        <div key={p.title} className="bg-surface-card border border-border rounded-xl p-3">
          <div className="text-xs font-bold mb-1 truncate">{p.title}</div>
          <span className="text-[10px] px-2 py-0.5 bg-surface-sunken rounded-full text-txt-tertiary">{p.tag}</span>
        </div>
      ))}
    </div>
  </div>
)

const CoffeeChatMockup = () => (
  <div className="space-y-3">
    <div className="bg-surface-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 bg-surface-sunken rounded-full flex items-center justify-center text-xs font-bold">P</div>
        <div>
          <div className="text-sm font-bold">박수진</div>
          <div className="text-[10px] text-txt-tertiary">디자이너 · Figma</div>
        </div>
      </div>
      <div className="text-xs text-txt-secondary mb-3">&quot;AI 스터디 플래너 프로젝트 관심 있어서 연락드려요!&quot;</div>
      <div className="flex gap-2">
        <div className="px-3 py-1 bg-brand text-white rounded-full text-[10px] font-medium">수락</div>
        <div className="px-3 py-1 border border-border rounded-full text-[10px] text-txt-tertiary">거절</div>
      </div>
    </div>
    <div className="flex items-center gap-4 px-4">
      {['대기중', '수락됨', '연락처 공개'].map((step, i) => (
        <React.Fragment key={step}>
          <div className="flex items-center gap-1.5">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              i <= 1 ? 'bg-brand text-white' : 'bg-surface-sunken text-txt-disabled'
            }`}>
              {i < 1 ? <Check size={10} /> : i + 1}
            </div>
            <span className={`text-[10px] ${i <= 1 ? 'text-brand font-medium' : 'text-txt-disabled'}`}>{step}</span>
          </div>
          {i < 2 && <div className={`flex-1 h-px ${i < 1 ? 'bg-brand' : 'bg-border'}`} />}
        </React.Fragment>
      ))}
    </div>
  </div>
)

const mockups: Record<string, React.FC> = {
  onboarding: OnboardingMockup,
  matching: MatchingMockup,
  explore: ExploreMockup,
  coffeechat: CoffeeChatMockup,
}

export const FeatureShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [paused, setPaused] = useState(false)

  const next = useCallback(() => {
    setActiveTab((prev) => (prev + 1) % tabs.length)
  }, [])

  // Auto-cycle every 5s
  useEffect(() => {
    if (paused) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [paused, next])

  const handleTabClick = (index: number) => {
    setActiveTab(index)
    setPaused(true)
    // Resume after 10s of inactivity
    setTimeout(() => setPaused(false), 10000)
  }

  const tab = tabs[activeTab]
  const Mockup = mockups[tab.id]

  return (
    <section id="features" className="w-full py-20 px-6 md:px-10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <SectionLabel>FEATURES</SectionLabel>
          <SectionTitle>Draft가 해주는 일</SectionTitle>
        </div>

        {/* Tab bar */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {tabs.map((t, i) => (
            <TabPill key={t.id} active={i === activeTab} onClick={() => handleTabClick(i)}>
              <span className="flex items-center gap-1.5">
                <t.icon size={14} />
                {t.label}
              </span>
            </TabPill>
          ))}
        </div>

        {/* Content: 2-col on lg, stack on mobile */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {/* Left: Description */}
            <div className="flex flex-col justify-center">
              <h3 className="text-xl md:text-2xl font-bold text-txt-primary mb-3">
                {tab.title}
              </h3>
              <p className="text-sm text-txt-secondary leading-relaxed mb-6 break-keep">
                {tab.description}
              </p>
              <ul className="space-y-3 mb-6">
                {tab.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-txt-secondary">
                    <Check size={16} className="text-brand shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
              <button className="group flex items-center gap-2 text-sm font-bold text-brand hover:underline w-fit">
                {tab.cta}
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Right: Mockup UI */}
            <div className="bg-surface-sunken rounded-2xl border border-border p-5 min-h-[320px]">
              <Mockup />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
