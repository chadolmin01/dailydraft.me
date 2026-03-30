'use client'

import React from 'react'
import { ChevronRight, Rocket, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/src/context/AuthContext'
import { cleanNickname } from '@/src/lib/clean-nickname'
import type { TalentCard, CategoryItem, UserRecommendation } from './types'

interface ExploreAsidePanelProps {
  talentCards: TalentCard[]
  sidebarRecs: UserRecommendation[]
  recsLoading?: boolean
  totalProjectCount: number
  projectCardCount: number
  categoriesCount: number
  onSelectPeople: () => void
  onSelectProfile: (id: string, byUserId: boolean) => void
}

function PeopleSkeletonRows() {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
          <div className="w-9 h-9 bg-surface-sunken rounded-xl border border-border" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="h-3.5 bg-surface-sunken rounded-sm w-20" />
            <div className="h-2.5 bg-surface-sunken rounded-sm w-28" />
          </div>
          <div className="h-4 w-8 bg-surface-sunken rounded-sm" />
        </div>
      ))}
    </>
  )
}

export function ExploreAsidePanel({
  talentCards,
  sidebarRecs,
  recsLoading,
  totalProjectCount,
  projectCardCount,
  categoriesCount,
  onSelectPeople,
  onSelectProfile,
}: ExploreAsidePanelProps) {
  const { isAuthenticated } = useAuth()
  const showAiRecs = isAuthenticated && sidebarRecs.length > 0
  const showLoading = isAuthenticated && recsLoading && sidebarRecs.length === 0

  return (
    <div className="space-y-4">
      {/* 추천 인재 */}
      <div className="relative bg-surface-card rounded-xl border border-border p-4 shadow-md">
        <div className="absolute top-1 left-1 w-2 h-2 border-l border-t border-surface-inverse/20" />
        <div className="absolute top-1 right-1 w-2 h-2 border-r border-t border-surface-inverse/20" />
        <h3 className="text-[0.625rem] font-medium text-txt-tertiary mb-3 flex items-center gap-2">
          <span className="w-4 h-4 bg-brand text-white flex items-center justify-center text-[0.5rem] font-bold">P</span>
          {showLoading ? (
            <span className="flex items-center gap-1.5">
              <Sparkles size={10} className="animate-pulse text-brand" />
              AI MATCHING...
            </span>
          ) : showAiRecs ? 'AI RECOMMENDED' : 'PEOPLE'}
        </h3>
        <div className="space-y-1">
          {showLoading ? (
            <PeopleSkeletonRows />
          ) : showAiRecs ? (
            sidebarRecs.map((rec) => (
              <div key={rec.user_id} onClick={() => onSelectProfile(rec.user_id, true)} className="relative flex items-center gap-3 p-2 border border-transparent hover:border-border hover:bg-surface-sunken transition-all cursor-pointer group animate-fade-in">
                <div className="w-9 h-9 bg-brand-bg border border-brand-border flex items-center justify-center text-xs font-bold text-brand">
                  {cleanNickname(rec.nickname || '??').substring(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-txt-primary truncate">{cleanNickname(rec.nickname || '')}</p>
                  <p className="text-[0.625rem] font-mono text-txt-disabled truncate">{rec.match_reason}</p>
                </div>
                <span className="text-[0.625rem] font-mono font-bold px-1.5 py-0.5 bg-brand-bg text-brand border border-brand-border">
                  {rec.match_score}%
                </span>
              </div>
            ))
          ) : (
            talentCards.slice(0, 4).map((t) => (
              <div key={t.id} onClick={() => onSelectProfile(t.id, false)} className="relative flex items-center gap-3 p-2 border border-transparent hover:border-border hover:bg-surface-sunken transition-all cursor-pointer group">
                <div className="w-9 h-9 bg-surface-sunken rounded-xl border border-border flex items-center justify-center text-xs font-bold text-txt-secondary">
                  {t.name.substring(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-txt-primary truncate">{t.name}</p>
                  <p className="text-[0.625rem] font-mono text-txt-disabled truncate">{t.university || t.role}</p>
                </div>
                <span className={`text-[0.625rem] font-mono font-bold px-1.5 py-0.5 border ${
                  t.status === 'OPEN' ? 'bg-status-success-bg text-indicator-online border-indicator-online/20' : 'bg-surface-sunken text-txt-tertiary border-border'
                }`}>
                  {t.status}
                </span>
              </div>
            ))
          )}
        </div>
        <div className="mt-3 pt-2 border-t border-border">
          <button
            onClick={onSelectPeople}
            className="w-full text-[0.625rem] font-mono text-txt-tertiary hover:text-brand flex items-center justify-center gap-1 py-1 transition-colors"
          >
            VIEW ALL PEOPLE <ChevronRight size={10} />
          </button>
        </div>
      </div>

      {/* CTA 배너 */}
      <div className="relative bg-brand p-5 text-white border border-brand shadow-sm overflow-hidden">
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
            className="w-full bg-white text-brand text-sm font-bold py-2.5 hover:bg-brand-bg transition-colors block text-center border border-white"
          >
            {isAuthenticated ? '프로젝트 시작하기' : '로그인하고 시작하기'}
          </Link>
        </div>
      </div>

      {/* 스탯 카드 */}
      <div className="relative bg-surface-card rounded-xl border border-border p-4 shadow-md">
        <h3 className="text-[0.625rem] font-medium text-txt-tertiary mb-3 flex items-center gap-2">
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
                <div className="w-16 h-1.5 bg-surface-sunken rounded-xl border border-border overflow-hidden">
                  <div className={`h-full ${stat.color}`} style={{ width: `${Math.min(100, stat.value * 3)}%` }} />
                </div>
                <span className="text-xs font-mono font-bold text-txt-secondary w-6 text-right">{stat.value}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-2 border-t border-border">
          <p className="text-[0.625rem] font-mono text-txt-disabled flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-indicator-online animate-pulse" />
            LIVE DATA
          </p>
        </div>
      </div>
    </div>
  )
}
