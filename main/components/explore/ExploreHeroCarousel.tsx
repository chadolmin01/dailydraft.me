'use client'

import React, { useState, useEffect } from 'react'
import { ChevronRight, ChevronLeft, ArrowRight, Upload, MessageCircle, Coffee } from 'lucide-react'
import Link from 'next/link'
import { PageContainer } from '@/components/ui/PageContainer'
import { useAuth } from '@/src/context/AuthContext'
import { HERO_SLIDE_COUNT } from './constants'

export function ExploreHeroCarousel() {
  const [heroSlide, setHeroSlide] = useState(0)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % HERO_SLIDE_COUNT)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  return (
    <PageContainer size="wide" className="pt-4 pb-4">
      <div className="relative bg-surface-card border border-border-strong overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,0.08)]">
        {/* 배경 */}
        <div className="absolute inset-0 bg-grid-engineering opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-card via-surface-card/80 to-transparent" />

        {/* 코너 마크 */}
        <div className="absolute top-2 left-2 w-3 h-3 border-l border-t border-black/30 z-10" />
        <div className="absolute top-2 right-2 w-3 h-3 border-r border-t border-black/30 z-10" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-l border-b border-black/30 z-10" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-r border-b border-black/30 z-10" />

        {/* 슬라이드 영역 */}
        <div className="relative z-10 h-[15rem] md:h-[14rem]">

          {/* 하단 네비게이션 (슬라이드 내부) */}
          <div className="absolute bottom-3 left-8 right-8 z-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {Array.from({ length: HERO_SLIDE_COUNT }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setHeroSlide(i)}
                  className={`transition-all duration-200 ${
                    heroSlide === i ? 'w-5 h-1.5 bg-black' : 'w-1.5 h-1.5 bg-border-strong/50 hover:bg-border-strong'
                  }`}
                  aria-label={`슬라이드 ${i + 1}`}
                />
              ))}
              <span className="text-[0.625rem] font-mono text-txt-disabled ml-1">{heroSlide + 1}/{HERO_SLIDE_COUNT}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setHeroSlide((prev) => (prev - 1 + HERO_SLIDE_COUNT) % HERO_SLIDE_COUNT)}
                className="w-6 h-6 flex items-center justify-center text-txt-disabled hover:text-black transition-colors"
                aria-label="이전"
              >
                <ChevronLeft size={12} />
              </button>
              <button
                onClick={() => setHeroSlide((prev) => (prev + 1) % HERO_SLIDE_COUNT)}
                className="w-6 h-6 flex items-center justify-center text-txt-disabled hover:text-black transition-colors"
                aria-label="다음"
              >
                <ChevronRight size={12} />
              </button>
            </div>
          </div>

          {/* Slide 0: CTA 히어로 */}
          <div className={`absolute inset-0 px-8 flex items-center transition-all duration-300 ${heroSlide === 0 ? 'opacity-100 translate-x-0' : heroSlide > 0 ? 'opacity-0 -translate-x-8 pointer-events-none' : 'opacity-0 translate-x-8 pointer-events-none'}`}>
            <div className="w-full flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-10">
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-surface-card border border-border-strong mb-3">
                  <div className="w-1.5 h-1.5 bg-green-500 animate-pulse" />
                  <span className="text-[0.625rem] font-mono font-bold text-black tracking-wider">OPEN BETA</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-txt-primary mb-2 break-keep leading-tight tracking-tight">
                  모든 프로젝트는 <span className="text-txt-tertiary">Draft에서 시작됩니다.</span>
                </h2>
                <p className="text-sm md:text-base text-txt-tertiary break-keep">
                  프로젝트를 공유하고, 피드백 받고, 함께할 사람을 만나세요.
                </p>
              </div>
              <div className="absolute bottom-10 right-8 flex flex-col items-end gap-1.5">
                <Link
                  href={isAuthenticated ? '/projects/new' : '/login'}
                  className="group inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-bold hover:bg-surface-inverse transition-all shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] border border-black"
                >
                  {isAuthenticated ? '프로젝트 올리기' : '시작하기'}
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <p className="text-[0.625rem] font-mono text-txt-tertiary tracking-wider">
                  {isAuthenticated ? '아이디어를 공유하세요' : '가입 30초 · 무료 · 바로 사용'}
                </p>
              </div>
            </div>
          </div>

          {/* Slide 1: 이용 방법 */}
          <div className={`absolute inset-0 px-8 flex items-center transition-all duration-300 ${heroSlide === 1 ? 'opacity-100 translate-x-0' : heroSlide > 1 ? 'opacity-0 -translate-x-8 pointer-events-none' : 'opacity-0 translate-x-8 pointer-events-none'}`}>
            <div className="w-full flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-8">
              <div className="shrink-0 md:w-52">
                <span className="text-[0.625rem] font-mono font-bold text-txt-tertiary tracking-wider block">HOW IT WORKS</span>
                <h2 className="text-xl md:text-2xl font-bold text-txt-primary mt-1">간단한 3단계</h2>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-3">
                {[
                  { num: 1, icon: Upload, title: '올리기', desc: '아이디어와 고민을 공유' },
                  { num: 2, icon: MessageCircle, title: '피드백', desc: '다양한 시각의 조언' },
                  { num: 3, icon: Coffee, title: '만나기', desc: '커피챗으로 팀빌딩' },
                ].map((step) => (
                  <div key={step.num} className="relative border border-border bg-surface-card/80 p-3">
                    <div className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-black text-white flex items-center justify-center text-[0.625rem] font-bold">{step.num}</div>
                    <div className="w-8 h-8 bg-surface-sunken border border-border flex items-center justify-center mb-2">
                      <step.icon size={15} className="text-txt-secondary" />
                    </div>
                    <h3 className="font-bold text-xs text-txt-primary mb-0.5">{step.title}</h3>
                    <p className="text-[0.625rem] text-txt-tertiary leading-snug break-keep">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Slide 2: 커뮤니티 피드백 */}
          <div className={`absolute inset-0 px-8 flex items-center transition-all duration-300 ${heroSlide === 2 ? 'opacity-100 translate-x-0' : heroSlide < 2 ? 'opacity-0 translate-x-8 pointer-events-none' : 'opacity-0 -translate-x-8 pointer-events-none'}`}>
            <div className="w-full flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-8">
              <div className="shrink-0 md:w-52">
                <span className="text-[0.625rem] font-mono font-bold text-txt-tertiary tracking-wider block">FEEDBACK</span>
                <h2 className="text-xl md:text-2xl font-bold text-txt-primary mt-1">솔직한 피드백</h2>
                <p className="text-xs text-txt-tertiary mt-1 break-keep hidden md:block">프로젝트를 올리면 다양한 관점의 피드백을 받을 수 있어요</p>
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { school: '연대 경영', name: '김OO', content: '타겟을 대학생으로 좁히는 게 낫지 않을까요? 차별점이 필요할 것 같아요.' },
                  { school: '고대 컴공', name: '박OO', content: '학교 인증 기능이 핵심이 될 것 같은데, 인증 방식이 궁금해요.' },
                  { school: '경희대 산공', name: '이OO', content: '에브리타임 연동부터 해보는 건 어때요? 이미 인증된 유저풀이 있잖아요.' },
                ].map((c, idx) => (
                  <div key={idx} className="relative border border-border bg-surface-sunken/80 p-3">
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
    </PageContainer>
  )
}
