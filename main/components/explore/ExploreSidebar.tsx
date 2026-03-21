'use client'

import React from 'react'
import { Check } from 'lucide-react'
import type { CategoryItem, TrendingTag, ActiveTab } from './types'

interface ExploreSidebarProps {
  activeTab: ActiveTab
  categories: CategoryItem[]
  selectedCategory: string
  onCategoryChange: (id: string) => void
  trendingTags: TrendingTag[]
  onTagClick: (tag: string) => void
  recruitingOnly: boolean
  onRecruitingOnlyChange: (value: boolean) => void
}

export function ExploreSidebar({
  activeTab,
  categories,
  selectedCategory,
  onCategoryChange,
  trendingTags,
  onTagClick,
  recruitingOnly,
  onRecruitingOnlyChange,
}: ExploreSidebarProps) {
  return (
    <div className="space-y-4">
      {/* 카테고리 */}
      <div className="relative bg-surface-card border border-border-strong p-4 shadow-sharp">
        <div className="absolute top-1 left-1 w-2 h-2 border-l border-t border-black/20" />
        <div className="absolute top-1 right-1 w-2 h-2 border-r border-t border-black/20" />
        <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="w-4 h-4 bg-black text-white flex items-center justify-center text-[0.5rem] font-bold">{activeTab === 'projects' ? 'C' : 'R'}</span>
          {activeTab === 'projects' ? 'CATEGORY' : 'ROLE'}
        </h3>
        <nav className="space-y-0.5">
          {categories.map((cat, idx) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`w-full flex items-center justify-between px-2.5 py-2 text-sm transition-all border ${
                selectedCategory === cat.id
                  ? 'bg-brand text-white border-brand shadow-solid-sm'
                  : 'text-txt-secondary border-transparent hover:bg-surface-sunken hover:border-border'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={`text-[0.625rem] font-mono ${selectedCategory === cat.id ? 'text-white/60' : 'text-txt-disabled'}`}>{String(idx).padStart(2, '0')}</span>
                <cat.icon size={13} />
                {cat.label}
              </span>
              {cat.count > 0 && (
                <span className={`text-[0.625rem] font-mono px-1.5 py-0.5 ${
                  selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-surface-sunken text-txt-tertiary'
                }`}>
                  {cat.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* 트렌딩 태그 */}
      <div className="relative bg-surface-card border border-border-strong p-4 shadow-sharp">
        <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="w-4 h-4 bg-indicator-trending text-white flex items-center justify-center text-[0.5rem] font-bold">{activeTab === 'projects' ? 'T' : 'S'}</span>
          {activeTab === 'projects' ? 'TRENDING' : 'POPULAR SKILLS'}
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
                    <span className="w-4 h-4 bg-surface-sunken border border-border flex items-center justify-center text-[0.5rem] font-mono text-txt-disabled">{idx + 1}</span>
                    {item.tag}
                  </span>
                  <span className="text-[0.625rem] font-mono text-txt-disabled">{item.count}</span>
                </div>
                <div className="w-full h-1 bg-surface-sunken border border-border overflow-hidden">
                  <div className="h-full bg-indicator-trending/60 transition-all group-hover:bg-indicator-trending" style={{ width: `${barWidth}%` }} />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 필터 */}
      {activeTab === 'projects' && (
        <div className="relative bg-surface-card border border-border-strong p-4 shadow-sharp">
          <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-4 h-4 bg-indicator-online text-white flex items-center justify-center text-[0.5rem] font-bold">F</span>
            FILTER
          </h3>
          <label className="flex items-center gap-2.5 text-sm text-txt-secondary cursor-pointer group">
            <div className={`w-4 h-4 border flex items-center justify-center transition-all ${
              recruitingOnly ? 'bg-indicator-online border-indicator-online' : 'border-border-strong group-hover:border-txt-secondary'
            }`}>
              {recruitingOnly && <Check size={10} className="text-white" strokeWidth={3} />}
            </div>
            <input
              type="checkbox"
              className="sr-only"
              checked={recruitingOnly}
              onChange={(e) => onRecruitingOnlyChange(e.target.checked)}
            />
            모집 중만 보기
          </label>
          <div className="mt-3 pt-3 border-t border-dashed border-border">
            <p className="text-[0.625rem] font-mono text-txt-disabled flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-indicator-online animate-pulse" />
              {recruitingOnly ? 'ACTIVE FILTER ON' : 'NO FILTER APPLIED'}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'people' && (
        <div className="relative bg-surface-card border border-border-strong p-4 shadow-sharp">
          <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-4 h-4 bg-brand text-white flex items-center justify-center text-[0.5rem] font-bold">i</span>
            INFO
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-txt-tertiary">공개 프로필</span>
              <span className="text-[0.625rem] font-mono font-bold bg-surface-sunken px-1.5 py-0.5 text-txt-primary">
                {categories.find(c => c.id === 'all')?.count ?? 0}
              </span>
            </div>
            {selectedCategory !== 'all' && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-txt-tertiary">필터 결과</span>
                <span className="text-[0.625rem] font-mono font-bold bg-brand-bg px-1.5 py-0.5 text-brand">
                  {categories.find(c => c.id === selectedCategory)?.count ?? 0}
                </span>
              </div>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-dashed border-border">
            <p className="text-[0.625rem] font-mono text-txt-disabled flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-brand animate-pulse" />
              {selectedCategory !== 'all' ? 'ROLE FILTER ON' : 'ALL ROLES'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
