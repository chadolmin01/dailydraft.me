'use client'

import React from 'react'
import Image from 'next/image'
import { ArrowRight, Sparkles, Users, Zap, Ruler } from 'lucide-react'

interface HeroProps {
  onCtaClick: () => void
  onSlidePanelOpen?: () => void
}

export const Hero: React.FC<HeroProps> = ({ onCtaClick, onSlidePanelOpen }) => {
  return (
    <section className="relative w-full pt-8 sm:pt-16 pb-16 sm:pb-32 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center">

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
        <div className="absolute top-20 -left-12 w-64 bg-white/90 backdrop-blur-sm p-4 rounded-none border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] animate-float rotate-[-2deg]">
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-black"></div>
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-black"></div>

            <div className="flex justify-between items-start mb-3 border-b border-dashed border-gray-300 pb-2">
                <div className="w-8 h-8 rounded-none border border-black bg-gray-50 flex items-center justify-center">
                    <Users size={16} className="text-black" />
                </div>
                <span className="text-[10px] font-mono border border-black px-1 text-black bg-yellow-50">모집 중</span>
            </div>
            <h3 className="text-sm font-bold mb-1">캠퍼스 중고거래</h3>
            <p className="text-xs text-gray-500">React Native / Node.js</p>
            <div className="mt-2 text-[8px] font-mono text-gray-400 text-right">MEMBERS: 2/4</div>
        </div>

        {/* Card 2: Team Building */}
        <div className="absolute top-32 -right-24 w-72 bg-[#4F46E5] p-5 rounded-sm shadow-xl animate-float-delayed rotate-[1deg] ring-1 ring-offset-4 ring-indigo-100">
            <div className="absolute top-0 right-0 p-1">
                <div className="w-2 h-2 border border-white/50 rounded-full"></div>
            </div>
            <div className="flex justify-between items-start mb-4">
                <div className="w-8 h-8 bg-white/10 flex items-center justify-center border border-white/20">
                    <Zap size={16} className="text-white" />
                </div>
                <span className="text-[10px] font-mono border border-white/30 text-white px-2 py-0.5">팀빌딩 중</span>
            </div>
            <h3 className="text-white font-bold text-lg mb-1 font-sans">AI 스터디 플래너</h3>
            <p className="text-indigo-100 text-xs font-mono">Next.js / Python / GPT</p>

            <div className="mt-3 flex justify-between items-end border-t border-white/10 pt-2">
                <span className="text-[8px] text-white/50 font-mono">디자이너 구해요</span>
                <span className="text-[8px] text-white/50 font-mono">MVP 단계</span>
            </div>
        </div>

        {/* Card 3: Status Card */}
        <div className="absolute bottom-20 left-10 w-56 bg-white p-4 border border-black shadow-none animate-float-slow rotate-[0deg] opacity-90">
             {/* Crosshairs corners */}
            <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-black"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-black"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-black"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-black"></div>

            <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-green-500 animate-pulse"></div>
                <span className="text-xs font-mono text-black font-bold">TEAM SYNERGY</span>
            </div>
            <div className="space-y-2">
                <div className="w-full bg-gray-100 h-2 border border-black overflow-hidden relative">
                    {/* Tick marks on progress bar */}
                    <div className="absolute top-0 left-[25%] h-full w-[1px] bg-white z-10"></div>
                    <div className="absolute top-0 left-[50%] h-full w-[1px] bg-white z-10"></div>
                    <div className="bg-black w-[85%] h-full"></div>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-gray-500">
                    <span>SKILL MATCH</span>
                    <span>85%</span>
                </div>
            </div>
        </div>
         {/* Card 4: Launched Project */}
        <div className="absolute bottom-40 -right-8 w-64 bg-[#111] p-5 shadow-2xl animate-float rotate-[-1deg] border border-gray-700">
             <div className="flex justify-between items-start mb-6">
                <div className="w-8 h-8 bg-white/10 flex items-center justify-center border border-white/10">
                    <Sparkles size={14} className="text-gray-300" />
                </div>
                <span className="text-[10px] font-mono border border-white/20 text-gray-300 px-2 py-0.5">런칭 완료</span>
            </div>
             <h3 className="text-white font-bold text-lg mb-1">학식 알리미</h3>
             <p className="text-gray-500 text-xs border-b border-gray-800 pb-2 mb-2">대학 식당 메뉴 알림 서비스</p>
             <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-[8px] text-gray-500 font-mono">3명이 함께 만들었어요</span>
             </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center mt-12 sm:mt-20 md:mt-32 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-8">
            <Ruler size={14} className="text-black" />
            <span className="text-xs font-bold text-black font-mono">DRAFT COMMUNITY</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.2] mb-6 text-slate-900">
          모든 프로젝트는<br />
          <span className="text-gray-400 relative">
            Draft에서 시작됩니다.
            <svg className="absolute -bottom-2 left-0 w-full h-3 text-indigo-500 opacity-50" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="4 2" />
            </svg>
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl leading-relaxed break-keep">
          프로젝트를 공유하고, 피드백 받고,<br className="hidden md:inline" />
          함께할 사람을 만나세요.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={onCtaClick}
            className="group w-full sm:w-auto flex items-center justify-center gap-2 bg-black text-white px-8 py-4 font-bold text-sm hover:bg-gray-800 transition-all duration-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] border border-black"
          >
            프로젝트 올리기
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onSlidePanelOpen}
            className="group w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 font-bold text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-black transition-all duration-200 hover:border-black"
          >
            <Sparkles size={16} />
            AI로 30초 만에 공고 만들기
          </button>
        </div>

        <div className="mt-12 flex items-center gap-4">
             <div className="flex -space-x-3">
                {[1,2,3,4].map((i) => (
                    <div key={i} className="w-8 h-8 border border-white bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500 overflow-hidden relative">
                        <Image
                          src={`https://picsum.photos/100/100?random=${i}`}
                          alt="User"
                          width={32}
                          height={32}
                          className="w-full h-full object-cover grayscale opacity-80"
                        />
                        {/* Overlay grid on avatar */}
                        <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzjwqheq4f///6E4gQkCKwYA+mYWeWc6jCQAAAAASUVORK5CYII=')] opacity-30"></div>
                    </div>
                ))}
             </div>
             <div className="text-left">
                <p className="text-xs font-bold text-black font-mono">MAKERS</p>
                <p className="text-[10px] text-gray-500">Growing community</p>
             </div>
        </div>
      </div>
    </section>
  )
}
