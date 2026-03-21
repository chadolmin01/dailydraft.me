'use client'

'use client'

import React from 'react'
import { Filter, X, ChevronRight, Check } from 'lucide-react'
import { useBackHandler } from '@/src/hooks/useBackHandler'
import type { CategoryItem, TrendingTag, ActiveTab } from './types'

interface ExploreMobileFilterProps {
  isOpen: boolean
  onToggle: () => void
  activeTab: ActiveTab
  categories: CategoryItem[]
  selectedCategory: string
  onCategoryChange: (id: string) => void
  trendingTags: TrendingTag[]
  onTagClick: (tag: string) => void
  recruitingOnly: boolean
  onRecruitingOnlyChange: (value: boolean) => void
}

export function ExploreMobileFilter({
  isOpen,
  onToggle,
  activeTab,
  categories,
  selectedCategory,
  onCategoryChange,
  trendingTags,
  onTagClick,
  recruitingOnly,
  onRecruitingOnlyChange,
}: ExploreMobileFilterProps) {
  useBackHandler(isOpen, onToggle, 'explore-filter')

  return (
    <div className="lg:hidden mb-4">
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 px-3 py-2 text-xs font-bold border transition-all w-full justify-center ${
          isOpen ? 'bg-black text-white border-black' : 'bg-surface-card text-txt-secondary border-border-strong hover:border-border-strong'
        }`}
      >
        <Filter size={14} />
        필터 {selectedCategory !== 'all' || recruitingOnly ? '(적용됨)' : ''}
        {isOpen ? <X size={14} /> : <ChevronRight size={14} className="rotate-90" />}
      </button>
      {isOpen && (
        <div className="mt-2 bg-surface-card border border-border-strong p-4 space-y-4 animate-in slide-in-from-top duration-200 shadow-sharp">
          {/* 카테고리 */}
          <div>
            <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-2">{activeTab === 'projects' ? 'CATEGORY' : 'ROLE'}</h3>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { onCategoryChange(cat.id); onToggle() }}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-brand text-white border-brand'
                      : 'bg-surface-sunken text-txt-secondary border-border hover:border-border-strong'
                  }`}
                >
                  <cat.icon size={12} />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          {/* 트렌딩 태그 */}
          <div>
            <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-2">{activeTab === 'projects' ? 'TRENDING' : 'POPULAR SKILLS'}</h3>
            <div className="flex flex-wrap gap-1.5">
              {trendingTags.map((item) => (
                <button
                  key={item.tag}
                  onClick={() => { onTagClick(item.tag); onToggle() }}
                  className="px-3 py-1.5 text-xs font-medium bg-surface-sunken text-txt-secondary border border-border hover:border-indicator-trending hover:text-indicator-trending transition-colors"
                >
                  {item.tag}
                </button>
              ))}
            </div>
          </div>
          {/* 필터 */}
          {activeTab === 'projects' && (
            <div className="pt-3 border-t border-dashed border-border">
              <label className="flex items-center gap-2.5 text-sm text-txt-secondary cursor-pointer min-h-[44px]">
                <div className={`w-5 h-5 sm:w-4 sm:h-4 border flex items-center justify-center transition-all ${
                  recruitingOnly ? 'bg-indicator-online border-indicator-online' : 'border-border-strong'
                }`}>
                  {recruitingOnly && <Check size={10} className="text-white" strokeWidth={3} />}
                </div>
                <input type="checkbox" className="sr-only" checked={recruitingOnly} onChange={(e) => onRecruitingOnlyChange(e.target.checked)} />
                모집 중만 보기
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
