'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { PageContainer } from '@/components/ui/PageContainer'
import { useAuth } from '@/src/context/AuthContext'

const SLIDE_COUNT = 3
const SWIPE_THRESHOLD = 50

export function ExploreHeroCarousel() {
  const [active, setActive] = useState(0)
  const { isAuthenticated } = useAuth()
  const touchStartX = useRef(0)
  const touchDeltaX = useRef(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % SLIDE_COUNT)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const goNext = useCallback(() => setActive((prev) => (prev + 1) % SLIDE_COUNT), [])
  const goPrev = useCallback(() => setActive((prev) => (prev - 1 + SLIDE_COUNT) % SLIDE_COUNT), [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchDeltaX.current = 0
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (touchDeltaX.current < -SWIPE_THRESHOLD) goNext()
    else if (touchDeltaX.current > SWIPE_THRESHOLD) goPrev()
  }, [goNext, goPrev])

  const order = [active, (active + 1) % SLIDE_COUNT, (active + 2) % SLIDE_COUNT]

  return (
    <PageContainer size="wide" className="pt-3 pb-1">
      <div className="flex gap-3 h-[16rem] sm:h-[18rem]">

        {/* ===== 왼쪽: 메인 강조 슬라이드 ===== */}
        <div
          className="relative flex-[2] min-w-0 bg-surface-card rounded-xl border border-border overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,0.08)] cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-border/80 active:scale-[0.995]"
          onClick={goNext}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="absolute inset-0 bg-grid-engineering opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-card via-surface-card/80 to-transparent" />

          {/* 코너 마크 */}
          <div className="absolute top-2 left-2 w-3 h-3 border-l border-t border-surface-inverse/30 z-10" />
          <div className="absolute top-2 right-2 w-3 h-3 border-r border-t border-surface-inverse/30 z-10" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-l border-b border-surface-inverse/30 z-10" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-r border-b border-surface-inverse/30 z-10" />

          {/* 인디케이터 */}
          <div className="absolute bottom-3 left-4 sm:left-6 z-20 flex items-center gap-2">
            {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setActive(i) }}
                className="p-2 -m-1.5"
                aria-label={`슬라이드 ${i + 1}`}
              >
                <span className={`block rounded-full transition-all duration-200 ${
                  active === i ? 'w-5 h-1.5 bg-black' : 'w-1.5 h-1.5 bg-border-strong/50'
                }`} />
              </button>
            ))}
            <span className="text-[10px] font-mono text-txt-disabled ml-1">{active + 1}/{SLIDE_COUNT}</span>
          </div>

          {/* 메인 슬라이드 콘텐츠 */}
          <div className="relative z-10 h-full">
            {/* Slide 0: 팀원 모집 */}
            <div className={`absolute inset-0 px-4 sm:px-6 flex items-start pt-4 sm:pt-10 transition-all duration-300 ${order[0] === 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <div className="w-full">
                <div className="inline-flex items-center gap-2 px-2 h-6 bg-surface-card rounded-xl border border-border mb-3">
                  <div className="w-1.5 h-1.5 bg-black rounded-full" />
                  <span className="text-[10px] font-mono font-bold text-black tracking-wider">TEAM</span>
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-txt-primary mb-1.5 break-keep leading-tight tracking-tight">
                  Draft 팀에 <span className="text-txt-tertiary">합류하고 싶다면?</span>
                </h2>
                <p className="text-sm text-txt-tertiary break-keep mb-3 sm:mb-6">
                  함께 만들어 갈 팀원을 찾고 있습니다. 프로젝트 페이지에서 자기소개와 함께 지원해 주세요.
                </p>
                <Link
                  href="/projects/b0de922b-c9ed-4f21-9a48-5454e6af5501"
                  className="group inline-flex items-center gap-2 px-5 py-2.5 bg-surface-inverse text-txt-inverse text-sm font-bold hover:bg-surface-inverse transition-all hover:opacity-90 active:scale-[0.97] border border-surface-inverse"
                  onClick={(e) => e.stopPropagation()}
                >
                  팀원 공고 보기
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Slide 1: 사용자 인터뷰 */}
            <div className={`absolute inset-0 px-4 sm:px-6 flex items-start pt-4 sm:pt-10 transition-all duration-300 ${order[0] === 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <div className="w-full">
                <div className="inline-flex items-center gap-2 px-2 h-6 bg-surface-card rounded-xl border border-border mb-3">
                  <span className="text-[10px] font-mono font-bold text-black tracking-wider">RESEARCH</span>
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-txt-primary mb-1.5 break-keep leading-tight tracking-tight">
                  서비스 인터뷰에 <span className="text-txt-tertiary">참여해주세요.</span>
                </h2>
                <p className="text-sm text-txt-tertiary break-keep mb-3 sm:mb-6">
                  Draft 팀이 솔직한 의견을 듣고 싶어요. 커피챗으로 편하게 연락주세요.
                </p>
                <Link
                  href="/explore?coffeeChat=38c7770c-f545-4f84-a8af-7e6b34c86285&msg=인터뷰+신청드립니다"
                  className="group inline-flex items-center gap-2 px-5 py-2.5 bg-surface-inverse text-txt-inverse text-sm font-bold hover:bg-surface-inverse transition-all hover:opacity-90 active:scale-[0.97] border border-surface-inverse"
                  onClick={(e) => e.stopPropagation()}
                >
                  커피챗 신청하기
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Slide 2: 프로젝트 홍보 */}
            <div className={`absolute inset-0 px-4 sm:px-6 flex items-start pt-4 sm:pt-10 transition-all duration-300 ${order[0] === 2 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <div className="w-full">
                <div className="inline-flex items-center gap-2 px-2 h-6 bg-surface-card rounded-xl border border-border mb-3">
                  <span className="text-[10px] font-mono font-bold text-black tracking-wider">PROMO</span>
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-txt-primary mb-1.5 break-keep leading-tight tracking-tight">
                  내 프로젝트를 <span className="text-txt-tertiary">알리고 싶다면?</span>
                </h2>
                <p className="text-sm text-txt-tertiary break-keep mb-3 sm:mb-6">
                  Draft를 통해 더 많은 사람에게 닿아보세요. 커피챗으로 문의해주세요.
                </p>
                <Link
                  href="/explore?coffeeChat=38c7770c-f545-4f84-a8af-7e6b34c86285&msg=프로젝트+홍보+문의드립니다"
                  className="group inline-flex items-center gap-2 px-5 py-2.5 bg-surface-inverse text-txt-inverse text-sm font-bold hover:bg-surface-inverse transition-all hover:opacity-90 active:scale-[0.97] border border-surface-inverse"
                  onClick={(e) => e.stopPropagation()}
                >
                  홍보 문의하기
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ===== 오른쪽: 미리보기 2개 (위/아래) ===== */}
        <div className="hidden md:flex flex-col gap-3 flex-1 min-w-0">

          {/* 오른쪽 상단 */}
          <button
            onClick={() => setActive(order[1])}
            className="relative flex-1 bg-surface-card rounded-xl border border-border overflow-hidden text-left hover:border-border hover:shadow-md hover-spring group"
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
            className="relative flex-1 bg-surface-card rounded-xl border border-border overflow-hidden text-left hover:border-border hover:shadow-md hover-spring group"
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
    white: { title: 'text-txt-primary', sub: 'text-txt-tertiary', tag: 'bg-surface-card border-border text-txt-secondary', badge: 'bg-surface-card border-border', label: 'text-black' },
    gray:  { title: 'text-white', sub: 'text-white/70', tag: 'bg-white/15 border-white/25 text-white/80', badge: 'bg-white/15 border-white/25', label: 'text-white' },
    black: { title: 'text-white', sub: 'text-white/50', tag: 'bg-white/10 border-white/15 text-white/60', badge: 'bg-white/10 border-white/15', label: 'text-white' },
  }
  const c = colors[tone]

  if (index === 0) {
    return (
      <div>
        <div className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 border mb-2 ${c.badge}`}>
          <div className="w-1 h-1 bg-current rounded-full" />
          <span className={`text-[0.5rem] font-mono font-bold tracking-wider ${c.label}`}>TEAM</span>
        </div>
        <h3 className={`text-sm font-bold leading-snug break-keep ${c.title}`}>
          Draft 팀에 합류하고 싶다면?
        </h3>
        <p className={`text-[10px] mt-1 break-keep ${c.sub}`}>
          팀원 공고를 확인해보세요
        </p>
      </div>
    )
  }

  if (index === 1) {
    return (
      <div>
        <div className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 border mb-2 ${c.badge}`}>
          <span className={`text-[0.5rem] font-mono font-bold tracking-wider ${c.label}`}>RESEARCH</span>
        </div>
        <h3 className={`text-sm font-bold leading-snug break-keep ${c.title}`}>
          서비스 인터뷰에 참여해주세요.
        </h3>
        <p className={`text-[10px] mt-1 break-keep ${c.sub}`}>
          커피챗으로 편하게 연락주세요
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 border mb-2 ${c.badge}`}>
        <span className={`text-[0.5rem] font-mono font-bold tracking-wider ${c.label}`}>PROMO</span>
      </div>
      <h3 className={`text-sm font-bold leading-snug break-keep ${c.title}`}>
        내 프로젝트를 알리고 싶다면?
      </h3>
      <p className={`text-[10px] mt-1 break-keep ${c.sub}`}>
        커피챗으로 홍보 문의해보세요
      </p>
    </div>
  )
}
