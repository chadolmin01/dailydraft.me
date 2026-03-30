'use client'

import React from 'react'
import { ArrowRight, Sparkles, Users, Zap, Ruler } from 'lucide-react'

interface HeroProps {
  onCtaClick: () => void
}

export const Hero: React.FC<HeroProps> = ({ onCtaClick }) => {
  return (
    <section className="relative w-full pt-16 sm:pt-24 pb-20 sm:pb-32 px-4 sm:px-6 md:px-10 max-w-6xl mx-auto flex flex-col items-center">

      {/* Background Decor Elements - Blueprint style cards */}
      <div className="absolute top-0 w-full h-full max-w-6xl mx-auto pointer-events-none z-0 hidden lg:block">

        {/* Decorative connecting lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
            <path d="M200,100 L400,300" stroke="black" strokeDasharray="4 4" fill="none" />
            <path d="M800,150 L600,350" stroke="black" strokeDasharray="4 4" fill="none" />
            <circle cx="200" cy="100" r="3" fill="black" />
            <circle cx="800" cy="150" r="3" fill="black" />
        </svg>

        {/* Card 1: Side Project */}
        <div className="absolute top-20 -left-12 w-64 bg-surface-card/90 backdrop-blur-sm p-4 border border-border-strong shadow-soft animate-float rotate-[-2deg]">
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-black"></div>
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-black"></div>

            <div className="flex justify-between items-start mb-3 border-b border-dashed border-border pb-2">
                <div className="w-8 h-8 border border-border-strong bg-surface-card flex items-center justify-center">
                    <Users size={16} className="text-black" />
                </div>
                <span className="text-[0.625rem] font-mono border border-border-strong px-1 text-black bg-surface-card">모집 중</span>
            </div>
            <h3 className="text-sm font-bold mb-1">캠퍼스 중고거래</h3>
            <p className="text-xs text-txt-tertiary">React Native / Node.js</p>
            <div className="mt-2 text-[0.5rem] font-mono text-txt-disabled text-right">MEMBERS: 2/4</div>
        </div>

        {/* Card 2: Team Building */}
        <div className="absolute top-32 -right-24 w-72 bg-brand p-5 shadow-brutal animate-float-delayed rotate-[1deg] ring-1 ring-offset-4 ring-brand-border">
            <div className="absolute top-0 right-0 p-1">
                <div className="w-2 h-2 border border-white/50"></div>
            </div>
            <div className="flex justify-between items-start mb-4">
                <div className="w-8 h-8 bg-white/10 flex items-center justify-center border border-white/20">
                    <Zap size={16} className="text-white" />
                </div>
                <span className="text-[0.625rem] font-mono border border-white/30 text-white px-2 py-0.5">팀빌딩 중</span>
            </div>
            <h3 className="text-white font-bold text-lg mb-1 font-sans">AI 스터디 플래너</h3>
            <p className="text-indigo-100 text-xs font-mono">Next.js / Python / GPT</p>

            <div className="mt-3 flex justify-between items-end border-t border-white/10 pt-2">
                <span className="text-[0.5rem] text-white/50 font-mono">디자이너 구해요</span>
                <span className="text-[0.5rem] text-white/50 font-mono">MVP 단계</span>
            </div>
        </div>

        {/* Card 3: Status Card */}
        <div className="absolute bottom-20 left-10 w-56 bg-surface-card p-4 border border-border-strong shadow-none animate-float-slow rotate-[0deg] opacity-90">
             {/* Crosshairs corners */}
            <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-border-strong"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-border-strong"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-border-strong"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-border-strong"></div>

            <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-indicator-online animate-pulse"></div>
                <span className="text-xs font-mono text-black font-bold">TEAM SYNERGY</span>
            </div>
            <div className="space-y-2">
                <div className="w-full bg-surface-sunken h-2 border border-border-strong overflow-hidden relative">
                    {/* Tick marks on progress bar */}
                    <div className="absolute top-0 left-[25%] h-full w-[1px] bg-white z-10"></div>
                    <div className="absolute top-0 left-[50%] h-full w-[1px] bg-white z-10"></div>
                    <div className="bg-black w-[85%] h-full"></div>
                </div>
                <div className="flex justify-between text-[0.625rem] font-mono text-txt-tertiary">
                    <span>SKILL MATCH</span>
                    <span>85%</span>
                </div>
            </div>
        </div>
         {/* Card 4: Launched Project */}
        <div className="absolute bottom-10 -right-8 w-64 bg-[#111] p-5 shadow-brutal animate-float rotate-[-1deg] border border-white/15">
             <div className="flex justify-between items-start mb-6">
                <div className="w-8 h-8 bg-white/10 flex items-center justify-center border border-white/10">
                    <Sparkles size={14} className="text-txt-disabled" />
                </div>
                <span className="text-[0.625rem] font-mono border border-white/20 text-txt-disabled px-2 py-0.5">런칭 완료</span>
            </div>
             <h3 className="text-white font-bold text-lg mb-1">학식 알리미</h3>
             <p className="text-txt-tertiary text-xs border-b border-white/10 pb-2 mb-2">대학 식당 메뉴 알림 서비스</p>
             <div className="flex gap-2">
                <div className="w-2 h-2 bg-indicator-online"></div>
                <span className="text-[0.5rem] text-txt-tertiary font-mono">3명이 함께 만들었어요</span>
             </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center mt-10 sm:mt-16 md:mt-28 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-card border border-border-strong shadow-solid-sm mb-8">
            <Ruler size={14} className="text-black" />
            <span className="text-[0.625rem] font-medium text-black">DRAFT COMMUNITY</span>
        </div>

        <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.2] mb-5 text-txt-primary">
          모든 프로젝트는<br />
          <span className="text-txt-disabled relative">
            Draft에서 시작됩니다.
            <svg className="absolute -bottom-2 left-0 w-full h-3 text-brand opacity-50" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="4 2" />
            </svg>
          </span>
        </h1>

        <p className="text-sm md:text-base text-txt-secondary mb-8 max-w-xl leading-relaxed break-keep">
          프로젝트를 공유하고, 피드백 받고,<br className="hidden md:inline" />
          함께할 사람을 만나세요.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={onCtaClick}
            className="group w-full sm:w-auto flex items-center justify-center gap-2 bg-surface-inverse text-txt-inverse px-6 py-3 font-bold text-xs hover:bg-surface-inverse/90 transition-all duration-200 hover:opacity-90 active:scale-[0.97] border border-surface-inverse"
          >
            프로젝트 올리기
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
            className="group w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 font-bold text-xs border border-border-strong bg-surface-card text-txt-secondary hover:bg-black hover:text-white transition-all duration-200"
          >
            프로젝트 둘러보기
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </section>
  )
}
