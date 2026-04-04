'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Users, Search, Coffee, Lightbulb, ArrowRight, Check, Lock } from 'lucide-react'
import { SectionLabel, SectionTitle, TabPill } from './shared'

const tabs = [
  {
    id: 'onboarding',
    label: 'AI 온보딩',
    icon: MessageSquare,
    title: '몇 가지 질문으로 완성되는 프로필',
    description: '기본 정보를 입력하고 인터랙티브 질문에 답하면, 팀 성향·소통 스타일·강점까지 자동으로 분석해 프로필을 만들어줍니다.',
    bullets: [
      '기술 스택, 관심 분야 선택',
      '팀 성향·소통 스타일 분석',
      'AI 강점 분석 및 추천 분야 생성',
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
      '프로필 업데이트 시 추천 갱신',
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
      '최신 프로젝트 피드',
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
  {
    id: 'ideation',
    label: '아이디어 검증',
    icon: Lightbulb,
    title: 'AI가 아이디어를 검증해줘요',
    description: '아이디어를 입력하면 개발자·디자이너·투자자 3가지 관점에서 AI가 분석합니다. PRD 생성과 사업계획서 작성까지 한 곳에서.',
    bullets: [
      '3가지 페르소나 기반 AI 검증',
      '검증 결과 → PRD 자동 생성',
      '사업계획서 템플릿 + PDF 내보내기',
    ],
    cta: '곧 공개',
    comingSoon: true,
  },
]

/* ── Mockup UIs ── */
const OnboardingMockup = () => (
  <div className="space-y-4">
    {/* 진행 바 */}
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-surface-sunken rounded-full overflow-hidden">
        <div className="h-full bg-brand rounded-full" style={{ width: '60%' }} />
      </div>
      <span className="text-[10px] font-mono text-txt-tertiary shrink-0">3 / 5</span>
    </div>

    {/* 현재 질문: 스텝 선택형 */}
    <div>
      <div className="text-sm font-bold text-txt-primary mb-2.5">Draft에서 무엇을 하고 싶으세요?</div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5 px-3 py-2.5 border-2 border-brand bg-brand/5 rounded-xl">
          <div className="w-4 h-4 rounded-full border-2 border-brand bg-brand flex items-center justify-center shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
          <span className="text-xs font-medium text-txt-primary">팀원 구하기</span>
        </div>
        <div className="flex items-center gap-2.5 px-3 py-2.5 border border-border rounded-xl">
          <div className="w-4 h-4 rounded-full border-2 border-border shrink-0" />
          <span className="text-xs text-txt-secondary">프로젝트 찾기</span>
        </div>
        <div className="flex items-center gap-2.5 px-3 py-2.5 border border-border rounded-xl">
          <div className="w-4 h-4 rounded-full border-2 border-border shrink-0" />
          <span className="text-xs text-txt-secondary">네트워킹</span>
        </div>
      </div>
    </div>

    {/* 인터뷰 미리보기 힌트 */}
    <motion.div
      className="bg-surface-card border border-brand-border rounded-xl p-3"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Check size={12} className="text-brand" />
        <span className="text-[10px] font-bold text-brand">다음: 성향 인터뷰</span>
      </div>
      <div className="text-[10px] text-txt-tertiary">팀 스타일·소통 방식·강점을 파악해요</div>
    </motion.div>
  </div>
)

const MatchingMockup = () => (
  <div className="space-y-3">
    {[
      { label: 'A', role: '백엔드 · Python', score: 92, tags: ['AI', 'LLM'] },
      { label: 'B', role: 'PM · 비즈니스', score: 85, tags: ['에듀테크', '소셜'] },
    ].map((match, i) => (
      <div key={i} className="bg-surface-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand/10 rounded-full flex items-center justify-center text-brand text-xs font-bold">
              {match.label}
            </div>
            <div>
              <div className="text-sm font-bold">멤버 {match.label}</div>
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

const IdeationMockup = () => (
  <div className="space-y-3">
    <div className="bg-surface-card border border-border rounded-xl p-4">
      <div className="text-[10px] font-mono text-txt-tertiary mb-2">아이디어 입력</div>
      <div className="text-sm text-txt-secondary mb-3">&quot;대학생 맞춤 AI 스터디 플래너&quot;</div>
      <div className="h-px bg-border mb-3" />
      <div className="text-[10px] font-mono text-txt-tertiary mb-2">AI 검증 결과</div>
      <div className="space-y-2">
        {[
          { persona: 'Developer', score: 'A', color: 'bg-brand/10 text-brand' },
          { persona: 'Designer', score: 'B+', color: 'bg-status-success-bg text-indicator-online' },
          { persona: 'Investor', score: 'A-', color: 'bg-indicator-premium/10 text-indicator-premium-border' },
        ].map((p) => (
          <div key={p.persona} className="flex items-center justify-between">
            <span className="text-xs text-txt-secondary">{p.persona}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.color}`}>{p.score}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="flex gap-2">
      <div className="flex-1 bg-surface-card border border-border rounded-xl p-3 text-center">
        <div className="text-[10px] text-txt-tertiary mb-1">PRD 생성</div>
        <div className="text-xs font-bold text-txt-primary">자동 생성</div>
      </div>
      <div className="flex-1 bg-surface-card border border-border rounded-xl p-3 text-center">
        <div className="text-[10px] text-txt-tertiary mb-1">사업계획서</div>
        <div className="text-xs font-bold text-txt-primary">PDF 내보내기</div>
      </div>
    </div>
  </div>
)

const CoffeeChatMockup = () => (
  <div className="space-y-3">
    <div className="bg-surface-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 bg-surface-sunken rounded-full flex items-center justify-center text-xs font-bold">D</div>
        <div>
          <div className="text-sm font-bold">디자이너</div>
          <div className="text-[10px] text-txt-tertiary">디자이너 · Figma</div>
        </div>
      </div>
      <div className="text-xs text-txt-secondary mb-3">&quot;프로젝트 관심 있어서 연락드려요!&quot;</div>
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
  ideation: IdeationMockup,
}

export const FeatureShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [paused, setPaused] = useState(false)

  // Auto-cycle only through the first 4 tabs (skip comingSoon)
  const autoTabCount = tabs.filter(t => !('comingSoon' in t && t.comingSoon)).length
  const next = useCallback(() => {
    setActiveTab((prev) => (prev + 1) % autoTabCount)
  }, [autoTabCount])

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
    <section id="features" className="w-full py-16 px-6 md:px-10">
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
                {'comingSoon' in t && t.comingSoon && (
                  <span className="text-[9px] font-mono bg-surface-sunken text-txt-disabled px-1.5 py-0.5 rounded-full border border-border">SOON</span>
                )}
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
              {'comingSoon' in tab && tab.comingSoon ? (
                <span className="flex items-center gap-2 text-sm font-bold text-txt-disabled w-fit">
                  <Lock size={14} />
                  {tab.cta}
                </span>
              ) : (
                <Link href="/login" className="group flex items-center gap-2 text-sm font-bold text-brand hover:underline w-fit">
                  {tab.cta}
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
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
