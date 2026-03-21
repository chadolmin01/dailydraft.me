'use client'

import React from 'react'
import { ChevronRight, Rocket, Lock } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/src/context/AuthContext'
import type { TalentCard, CategoryItem, UserRecommendation } from './types'

interface ExploreAsidePanelProps {
  talentCards: TalentCard[]
  sidebarRecs: UserRecommendation[]
  totalProjectCount: number
  projectCardCount: number
  categoriesCount: number
  onSelectPeople: () => void
  onSelectProfile: (id: string, byUserId: boolean) => void
}

const PLACEHOLDER_NAMES = ['김OO', '이OO', '박OO', '최OO']
const PLACEHOLDER_REASONS = ['비전이 비슷해요', '관심 분야 일치', '협업 스타일 맞음', '기술 스택 호환']
const PLACEHOLDER_SCORES = [92, 87, 81, 76]

export function ExploreAsidePanel({
  talentCards,
  sidebarRecs,
  totalProjectCount,
  projectCardCount,
  categoriesCount,
  onSelectPeople,
  onSelectProfile,
}: ExploreAsidePanelProps) {
  const { isAuthenticated } = useAuth()

  return (
    <div className="space-y-4">
      {/* AI 추천 인재 */}
      <div className="relative bg-surface-card border border-border-strong p-4 shadow-sharp">
        <div className="absolute top-1 left-1 w-2 h-2 border-l border-t border-black/20" />
        <div className="absolute top-1 right-1 w-2 h-2 border-r border-t border-black/20" />
        <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="w-4 h-4 bg-brand text-white flex items-center justify-center text-[0.5rem] font-bold">P</span>
          AI RECOMMENDED
        </h3>

        {isAuthenticated ? (
          /* 로그인 상태 */
          sidebarRecs.length > 0 ? (
            <div className="space-y-1">
              {sidebarRecs.map((rec, idx) => (
                <div
                  key={rec.user_id}
                  onClick={() => onSelectProfile(rec.user_id, true)}
                  className="relative flex items-center gap-3 p-2 border border-transparent hover:border-border hover:bg-surface-sunken transition-all cursor-pointer group animate-fadeIn"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <div className="w-9 h-9 bg-brand-bg border border-brand-border flex items-center justify-center text-xs font-bold text-brand">
                    {(rec.nickname || '??').substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-txt-primary">{rec.nickname}</p>
                    <p className="text-[0.625rem] font-mono text-txt-disabled truncate">{rec.match_reason}</p>
                  </div>
                  <span className="text-[0.625rem] font-mono font-bold px-1.5 py-0.5 bg-brand-bg text-brand border border-brand-border">
                    {rec.match_score}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            /* 로그인 됐지만 추천 데이터 로딩/없음 */
            <div className="space-y-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                  <div className="w-9 h-9 bg-surface-sunken border border-border" />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="h-3.5 bg-surface-sunken w-16" />
                    <div className="h-2.5 bg-surface-sunken w-24" />
                  </div>
                  <div className="h-5 w-10 bg-surface-sunken border border-border" />
                </div>
              ))}
              <p className="text-[0.625rem] font-mono text-txt-disabled text-center pt-2">추천 분석 중...</p>
            </div>
          )
        ) : (
          /* 비로그인: 잠금 상태 placeholder */
          <div className="relative">
            <div className="space-y-1 select-none" aria-hidden="true">
              {PLACEHOLDER_NAMES.map((name, i) => (
                <div key={i} className="relative flex items-center gap-3 p-2 opacity-40 blur-[2px]">
                  <div className="w-9 h-9 bg-surface-sunken border border-border flex items-center justify-center text-xs font-bold text-txt-disabled">
                    {name.substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-txt-tertiary">{name}</p>
                    <p className="text-[0.625rem] font-mono text-txt-disabled">{PLACEHOLDER_REASONS[i]}</p>
                  </div>
                  <span className="text-[0.625rem] font-mono font-bold px-1.5 py-0.5 bg-surface-sunken text-txt-disabled border border-border">
                    {PLACEHOLDER_SCORES[i]}%
                  </span>
                </div>
              ))}
            </div>
            {/* 잠금 오버레이 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-card/60 backdrop-blur-[1px]">
              <div className="w-8 h-8 bg-surface-sunken border border-border flex items-center justify-center mb-2">
                <Lock size={14} className="text-txt-disabled" />
              </div>
              <p className="text-xs font-medium text-txt-secondary text-center mb-1">AI 추천을 받아보세요</p>
              <p className="text-[0.625rem] font-mono text-txt-disabled text-center mb-3">프로필 기반 맞춤 매칭</p>
              <Link
                href="/login"
                className="px-4 py-1.5 text-[0.625rem] font-mono font-bold text-white bg-brand border border-brand hover:bg-brand/90 transition-colors"
              >
                LOGIN
              </Link>
            </div>
          </div>
        )}

        {isAuthenticated && (
          <div className="mt-3 pt-2 border-t border-dashed border-border">
            <button
              onClick={onSelectPeople}
              className="w-full text-[0.625rem] font-mono text-txt-tertiary hover:text-brand flex items-center justify-center gap-1 py-1 transition-colors"
            >
              VIEW ALL PEOPLE <ChevronRight size={10} />
            </button>
          </div>
        )}
      </div>

      {/* CTA 배너 */}
      <div className="relative bg-brand p-5 text-white border border-brand shadow-solid-sm overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />
        <div className="absolute top-2 left-2 w-2.5 h-2.5 border-l border-t border-white/30" />
        <div className="absolute top-2 right-2 w-2.5 h-2.5 border-r border-t border-white/30" />
        <div className="absolute bottom-2 left-2 w-2.5 h-2.5 border-l border-b border-white/30" />
        <div className="absolute bottom-2 right-2 w-2.5 h-2.5 border-r border-b border-white/30" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-white/15 border border-white/20 flex items-center justify-center">
              <Rocket size={16} />
            </div>
            <span className="text-[0.625rem] font-mono font-bold text-white/60 tracking-wider">NEW PROJECT</span>
          </div>
          <h3 className="font-bold text-base mb-1">아이디어가 있나요?</h3>
          <p className="text-white/60 text-xs mb-4 font-mono">팀을 구성하고 프로젝트를 시작하세요</p>
          <Link
            href={isAuthenticated ? '/projects/new' : '/login'}
            className="w-full bg-white text-brand text-sm font-bold py-2.5 hover:bg-brand-bg transition-colors block text-center border border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]"
          >
            {isAuthenticated ? '프로젝트 시작하기' : '로그인하고 시작하기'}
          </Link>
        </div>
      </div>

      {/* 스탯 카드 */}
      <div className="relative bg-surface-card border border-border-strong p-4 shadow-sharp">
        <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="w-4 h-4 bg-indicator-premium text-white flex items-center justify-center text-[0.5rem] font-bold">S</span>
          STATS
        </h3>
        <div className="space-y-2.5">
          {[
            { label: 'PROJECTS', value: totalProjectCount || projectCardCount, color: 'bg-brand' },
            { label: 'PEOPLE', value: talentCards.length, color: 'bg-indicator-online' },
            { label: 'CATEGORIES', value: categoriesCount, color: 'bg-indicator-premium' },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center justify-between">
              <span className="text-[0.625rem] font-mono text-txt-disabled">{stat.label}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-surface-sunken border border-border overflow-hidden">
                  <div className={`h-full ${stat.color}`} style={{ width: `${Math.min(100, stat.value * 3)}%` }} />
                </div>
                <span className="text-xs font-mono font-bold text-txt-secondary w-6 text-right">{stat.value}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-2 border-t border-dashed border-border">
          <p className="text-[0.625rem] font-mono text-txt-disabled flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-indicator-online animate-pulse" />
            LIVE DATA
          </p>
        </div>
      </div>
    </div>
  )
}
