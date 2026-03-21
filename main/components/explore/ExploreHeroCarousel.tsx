'use client'

import React, { useState, useEffect } from 'react'
import { ArrowRight, Upload, MessageCircle, Coffee } from 'lucide-react'
import Link from 'next/link'
import { PageContainer } from '@/components/ui/PageContainer'
import { useAuth } from '@/src/context/AuthContext'

const SLIDE_COUNT = 3

export function ExploreHeroCarousel() {
  const [active, setActive] = useState(0)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % SLIDE_COUNT)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const order = [active, (active + 1) % SLIDE_COUNT, (active + 2) % SLIDE_COUNT]

  return (
    <PageContainer size="wide" className="pt-4 pb-4">
      <div className="flex gap-3 h-[14rem] sm:h-[20rem]">

        {/* ===== 왼쪽: 메인 강조 슬라이드 ===== */}
        <div
          className="relative flex-[2] min-w-0 bg-surface-card border border-border-strong overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,0.08)] cursor-pointer transition-all duration-300"
          onClick={() => setActive((prev) => (prev + 1) % SLIDE_COUNT)}
        >
          <div className="absolute inset-0 bg-grid-engineering opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-card via-surface-card/80 to-transparent" />

          {/* 코너 마크 */}
          <div className="absolute top-2 left-2 w-3 h-3 border-l border-t border-black/30 z-10" />
          <div className="absolute top-2 right-2 w-3 h-3 border-r border-t border-black/30 z-10" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-l border-b border-black/30 z-10" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-r border-b border-black/30 z-10" />

          {/* 인디케이터 */}
          <div className="absolute bottom-3 left-6 z-20 flex items-center gap-2">
            {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setActive(i) }}
                className={`transition-all duration-200 ${
                  active === i ? 'w-5 h-1.5 bg-black' : 'w-1.5 h-1.5 bg-border-strong/50 hover:bg-border-strong'
                }`}
                aria-label={`슬라이드 ${i + 1}`}
              />
            ))}
            <span className="text-[0.625rem] font-mono text-txt-disabled ml-1">{active + 1}/{SLIDE_COUNT}</span>
          </div>

          {/* 메인 슬라이드 콘텐츠 */}
          <div className="relative z-10 h-full">
            {/* Slide 0: CTA */}
            <div className={`absolute inset-0 px-4 sm:px-6 flex items-center transition-all duration-300 ${order[0] === 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <div className="w-full">
                <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-surface-card border border-border-strong mb-4">
                  <div className="w-1.5 h-1.5 bg-indicator-online animate-pulse" />
                  <span className="text-[0.625rem] font-mono font-bold text-black tracking-wider">OPEN BETA</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-txt-primary mb-2 break-keep leading-tight tracking-tight">
                  모든 프로젝트는 <span className="text-txt-tertiary">Draft에서 시작됩니다.</span>
                </h2>
                <p className="text-sm text-txt-tertiary break-keep mb-6">
                  프로젝트를 공유하고, 피드백 받고, 함께할 사람을 만나세요.
                </p>
                <Link
                  href={isAuthenticated ? '/projects/new' : '/login'}
                  className="group inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-bold hover:bg-surface-inverse transition-all shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] border border-black"
                >
                  {isAuthenticated ? '프로젝트 올리기' : '시작하기'}
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Slide 1: How it works */}
            <div className={`absolute inset-0 px-4 sm:px-6 flex items-center transition-all duration-300 ${order[0] === 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <div className="w-full">
                <span className="text-[0.625rem] font-mono font-bold text-txt-tertiary tracking-wider block">HOW IT WORKS</span>
                <h2 className="text-2xl md:text-3xl font-bold text-txt-primary mt-1 mb-6">간단한 3단계</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { num: 1, icon: Upload, title: '올리기', desc: '아이디어와 고민을 공유' },
                    { num: 2, icon: MessageCircle, title: '피드백', desc: '다양한 시각의 조언' },
                    { num: 3, icon: Coffee, title: '만나기', desc: '커피챗으로 팀빌딩' },
                  ].map((step) => (
                    <div key={step.num} className="relative border border-border bg-surface-card/80 p-3">
                      <div className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-black text-white flex items-center justify-center text-[0.625rem] font-bold">{step.num}</div>
                      <div className="w-8 h-8 bg-surface-card border border-border flex items-center justify-center mb-2">
                        <step.icon size={15} className="text-txt-secondary" />
                      </div>
                      <h3 className="font-bold text-xs text-txt-primary mb-0.5">{step.title}</h3>
                      <p className="text-[0.625rem] text-txt-tertiary leading-snug break-keep">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Slide 2: Feedback */}
            <div className={`absolute inset-0 px-4 sm:px-6 flex items-center transition-all duration-300 ${order[0] === 2 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <div className="w-full">
                <span className="text-[0.625rem] font-mono font-bold text-txt-tertiary tracking-wider block">FEEDBACK</span>
                <h2 className="text-2xl md:text-3xl font-bold text-txt-primary mt-1 mb-2">솔직한 피드백</h2>
                <p className="text-xs text-txt-tertiary mb-5 break-keep">프로젝트를 올리면 다양한 관점의 피드백을 받을 수 있어요</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { school: '연대 경영', name: '김OO', content: '타겟을 대학생으로 좁히는 게 낫지 않을까요? 차별점이 필요할 것 같아요.' },
                    { school: '고대 컴공', name: '박OO', content: '학교 인증 기능이 핵심이 될 것 같은데, 인증 방식이 궁금해요.' },
                    { school: '경희대 산공', name: '이OO', content: '에브리타임 연동부터 해보는 건 어때요? 이미 인증된 유저풀이 있잖아요.' },
                  ].map((c, idx) => (
                    <div key={idx} className="relative border border-border bg-surface-card p-3">
                      <div className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-black text-white flex items-center justify-center text-[0.625rem] font-bold">{idx + 1}</div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[0.625rem] font-mono text-txt-tertiary">{c.school}</span>
                        <span className="text-[0.625rem] text-txt-disabled">|</span>
                        <span className="text-[0.625rem] font-bold text-txt-secondary">{c.name}</span>
                      </div>
                      <p className="text-xs text-txt-secondary leading-relaxed break-keep line-clamp-2">{c.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== 오른쪽: 미리보기 2개 (위/아래) ===== */}
        <div className="hidden md:flex flex-col gap-3 flex-1 min-w-0">

          {/* 오른쪽 상단 */}
          <button
            onClick={() => setActive(order[1])}
            className="relative flex-1 bg-surface-card border border-border overflow-hidden text-left hover:border-border-strong hover:shadow-solid-sm transition-all duration-200 group"
          >
            <div className="absolute inset-0 bg-grid-engineering opacity-20" />
            <div className="relative z-10 h-full px-4 flex items-center">
              <SlidePreview index={order[1]} isAuthenticated={isAuthenticated} />
            </div>
            <div className="absolute top-2 right-2 text-[0.5rem] font-mono text-txt-disabled opacity-0 group-hover:opacity-100 transition-opacity">CLICK</div>
          </button>

          {/* 오른쪽 하단 */}
          <button
            onClick={() => setActive(order[2])}
            className="relative flex-1 bg-surface-card border border-border overflow-hidden text-left hover:border-border-strong hover:shadow-solid-sm transition-all duration-200 group"
          >
            <div className="absolute inset-0 bg-grid-engineering opacity-20" />
            <div className="relative z-10 h-full px-4 flex items-center">
              <SlidePreview index={order[2]} isAuthenticated={isAuthenticated} />
            </div>
            <div className="absolute top-2 right-2 text-[0.5rem] font-mono text-txt-disabled opacity-0 group-hover:opacity-100 transition-opacity">CLICK</div>
          </button>
        </div>
      </div>
    </PageContainer>
  )
}

/* ── 오른쪽 미리보기 카드 콘텐츠 ── */
function SlidePreview({ index, isAuthenticated, tone = 'white' }: { index: number; isAuthenticated: boolean; tone?: 'white' | 'gray' | 'black' }) {
  const colors = {
    white: { title: 'text-txt-primary', sub: 'text-txt-tertiary', tag: 'bg-surface-card border-border text-txt-secondary', badge: 'bg-surface-card border-border-strong', label: 'text-black' },
    gray:  { title: 'text-white', sub: 'text-white/70', tag: 'bg-white/15 border-white/25 text-white/80', badge: 'bg-white/15 border-white/25', label: 'text-white' },
    black: { title: 'text-white', sub: 'text-white/50', tag: 'bg-white/10 border-white/15 text-white/60', badge: 'bg-white/10 border-white/15', label: 'text-white' },
  }
  const c = colors[tone]

  if (index === 0) {
    return (
      <div>
        <div className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 border mb-2 ${c.badge}`}>
          <div className="w-1 h-1 bg-indicator-online animate-pulse" />
          <span className={`text-[0.5rem] font-mono font-bold tracking-wider ${c.label}`}>OPEN BETA</span>
        </div>
        <h3 className={`text-sm font-bold leading-snug break-keep ${c.title}`}>
          모든 프로젝트는 Draft에서 시작됩니다.
        </h3>
        <p className={`text-[0.625rem] mt-1 break-keep ${c.sub}`}>
          {isAuthenticated ? '프로젝트를 올려보세요' : '가입하고 시작하세요'}
        </p>
      </div>
    )
  }

  if (index === 1) {
    return (
      <div>
        <span className={`text-[0.5rem] font-mono font-bold tracking-wider block ${c.sub}`}>HOW IT WORKS</span>
        <h3 className={`text-sm font-bold mt-1 ${c.title}`}>간단한 3단계</h3>
        <div className="flex gap-2 mt-2">
          {['올리기', '피드백', '만나기'].map((t, i) => (
            <span key={i} className={`px-1.5 py-0.5 border text-[0.5rem] font-mono ${c.tag}`}>{i + 1}. {t}</span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <span className={`text-[0.5rem] font-mono font-bold tracking-wider block ${c.sub}`}>FEEDBACK</span>
      <h3 className={`text-sm font-bold mt-1 ${c.title}`}>솔직한 피드백</h3>
      <p className={`text-[0.625rem] mt-1 break-keep line-clamp-2 ${c.sub}`}>
        다양한 관점의 피드백을 받아보세요
      </p>
    </div>
  )
}
