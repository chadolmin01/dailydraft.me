'use client'

import React from 'react'
import Image from 'next/image'
import { ChevronRight, Rocket, Sparkles, User } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/src/context/AuthContext'
import { useProfile } from '@/src/hooks/useProfile'
import { positionLabel } from '@/src/constants/roles'
import { useProfileCompletion } from '@/src/hooks/useProfileCompletion'
import { cleanNickname } from '@/src/lib/clean-nickname'
import type { CategoryItem, TrendingTag, ActiveTab, TalentCard, UserRecommendation } from './types'

interface ExploreSidebarProps {
  activeTab: ActiveTab
  categories: CategoryItem[]
  selectedCategory: string
  onCategoryChange: (id: string) => void
  trendingTags: TrendingTag[]
  onTagClick: (tag: string) => void
  talentCards?: TalentCard[]
  sidebarRecs?: UserRecommendation[]
  recsLoading?: boolean
  onSelectPeople?: () => void
  onSelectProfile?: (id: string, byUserId: boolean) => void
}

export function ExploreSidebar({
  activeTab,
  categories,
  selectedCategory,
  onCategoryChange,
  trendingTags,
  onTagClick,
  talentCards = [],
  sidebarRecs = [],
  recsLoading,
  onSelectPeople,
  onSelectProfile,
}: ExploreSidebarProps) {
  const { isAuthenticated } = useAuth()
  const { data: profile } = useProfile()
  const completion = useProfileCompletion(profile)
  const showAiRecs = isAuthenticated && sidebarRecs.length > 0
  const showLoading = isAuthenticated && recsLoading && sidebarRecs.length === 0
  return (
    <div className="space-y-4">
      {/* 내 프로필 카드 */}
      {isAuthenticated && profile && (
        <Link href="/profile" className="block bg-surface-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-brand-bg flex items-center justify-center text-sm font-bold text-brand shrink-0 overflow-hidden">
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt="" width={40} height={40} className="object-cover w-full h-full" />
              ) : (
                cleanNickname(profile.nickname || '').slice(0, 2).toUpperCase() || <User size={16} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-txt-primary truncate">{cleanNickname(profile.nickname || '') || '이름 미설정'}</p>
              <p className="text-[11px] text-txt-tertiary truncate">
                {[positionLabel(profile.desired_position || '') || profile.desired_position, profile.university].filter(Boolean).join(' · ') || '프로필을 완성해보세요'}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-txt-tertiary">프로필 완성도</span>
            <span className="text-[10px] font-mono font-bold text-txt-primary">{completion.pct}%</span>
          </div>
          <div className="w-full h-1.5 bg-surface-sunken rounded-full overflow-hidden">
            <div
              className="h-full bg-brand transition-all rounded-full"
              style={{ width: `${completion.pct}%` }}
            />
          </div>
          {completion.pct < 100 && (
            <p className="text-[10px] text-txt-disabled mt-2 group-hover:text-brand transition-colors">
              {completion.fields.find(f => !f.done)?.label} 추가하기 →
            </p>
          )}
        </Link>
      )}

      {/* AI 추천 인재 */}
      {onSelectProfile && (
        <div className="bg-surface-card rounded-xl border border-border p-4">
          <h3 className="text-xs font-medium text-txt-tertiary mb-3 flex items-center gap-2">
            {showLoading ? (
              <span className="flex items-center gap-1.5">
                <Sparkles size={10} className="animate-pulse text-brand" />
                AI 매칭 중...
              </span>
            ) : showAiRecs ? 'AI 추천' : 'PEOPLE'}
          </h3>
          <div className="space-y-1">
            {showLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <div className="w-8 h-8 bg-surface-sunken rounded-full skeleton-shimmer" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-surface-sunken rounded w-16 skeleton-shimmer" />
                    <div className="h-2.5 bg-surface-sunken rounded w-24 skeleton-shimmer" />
                  </div>
                </div>
              ))
            ) : showAiRecs ? (
              sidebarRecs.slice(0, 4).map((rec) => (
                <button key={rec.user_id} onClick={() => onSelectProfile(rec.user_id, true)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-surface-sunken transition-colors text-left">
                  <div className="w-8 h-8 bg-brand-bg rounded-full flex items-center justify-center text-xs font-bold text-brand shrink-0">
                    {cleanNickname(rec.nickname || '??').substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-txt-primary truncate">{cleanNickname(rec.nickname || '')}</p>
                    <p className="text-xs text-txt-tertiary truncate">{rec.match_reason}</p>
                  </div>
                  <span className="text-[10px] font-bold text-brand shrink-0">{rec.match_score}%</span>
                </button>
              ))
            ) : (
              talentCards.slice(0, 4).map((t) => (
                <button key={t.id} onClick={() => onSelectProfile(t.id, false)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-surface-sunken transition-colors text-left">
                  <div className="w-8 h-8 bg-surface-sunken rounded-full flex items-center justify-center text-xs font-bold text-txt-secondary shrink-0">
                    {t.name.substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-txt-primary truncate">{t.name}</p>
                    <p className="text-xs text-txt-tertiary truncate">{t.university || t.role}</p>
                  </div>
                  <span className={`text-[10px] font-bold shrink-0 ${t.status === 'OPEN' ? 'text-indicator-online' : 'text-txt-tertiary'}`}>
                    {t.status}
                  </span>
                </button>
              ))
            )}
          </div>
          {onSelectPeople && (
            <button
              onClick={onSelectPeople}
              className="w-full mt-2 pt-2 border-t border-border text-xs text-txt-tertiary hover:text-brand flex items-center justify-center gap-1 py-1.5 transition-colors"
            >
              전체 보기 <ChevronRight size={12} />
            </button>
          )}
        </div>
      )}

      {/* 트렌딩 태그 */}
      <div className="bg-surface-card rounded-xl border border-border p-4">
        <h3 className="text-xs font-medium text-txt-tertiary mb-3">
          {activeTab === 'projects' ? '트렌딩' : '인기 스킬'}
        </h3>
        <div className="space-y-1.5">
          {trendingTags.map((item, idx) => {
            const barWidth = Math.max(20, Math.round((item.count / (trendingTags[0]?.count || 1)) * 100))
            return (
              <button
                key={item.tag}
                onClick={() => onTagClick(item.tag)}
                className="w-full group text-left"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="flex items-center gap-1.5 text-sm text-txt-secondary group-hover:text-txt-primary transition-colors">
                    <span className="w-4 h-4 bg-surface-sunken rounded-xl border border-border flex items-center justify-center text-[0.5rem] font-mono text-txt-disabled">{idx + 1}</span>
                    {item.tag}
                  </span>
                  <span className="text-[10px] font-mono text-txt-disabled">{item.count}</span>
                </div>
                <div className="w-full h-1 bg-surface-sunken rounded-xl border border-border overflow-hidden">
                  <div className="h-full bg-indicator-trending/60 transition-all group-hover:bg-indicator-trending" style={{ width: `${barWidth}%` }} />
                </div>
              </button>
            )
          })}
        </div>
      </div>


      {activeTab === 'people' && (
        <div className="bg-surface-card rounded-xl border border-border p-4">
          <h3 className="text-xs font-medium text-txt-tertiary mb-3">정보</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-txt-tertiary">공개 프로필</span>
              <span className="text-[10px] font-mono font-bold bg-surface-sunken px-1.5 py-0.5 text-txt-primary">
                {categories.find(c => c.id === 'all')?.count ?? 0}
              </span>
            </div>
            {selectedCategory !== 'all' && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-txt-tertiary">필터 결과</span>
                <span className="text-[10px] font-mono font-bold bg-brand-bg px-1.5 py-0.5 text-brand">
                  {categories.find(c => c.id === selectedCategory)?.count ?? 0}
                </span>
              </div>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-[10px] font-mono text-txt-disabled flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-brand animate-pulse" />
              {selectedCategory !== 'all' ? 'ROLE FILTER ON' : 'ALL ROLES'}
            </p>
          </div>
        </div>
      )}

      {/* 새 프로젝트 CTA */}
      <div className="bg-brand rounded-xl p-4 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Rocket size={16} />
          <span className="text-xs font-bold">새 프로젝트</span>
        </div>
        <p className="text-white/70 text-xs mb-3">팀을 구성하고 프로젝트를 시작하세요</p>
        <Link
          href={isAuthenticated ? '/projects/new' : '/login'}
          className="block w-full text-center py-2 bg-white text-brand text-sm font-bold rounded-lg hover:bg-white/90 transition-colors"
        >
          {isAuthenticated ? '시작하기' : '로그인'}
        </Link>
      </div>
    </div>
  )
}
