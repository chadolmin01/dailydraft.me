'use client'

import React from 'react'
import { Check } from 'lucide-react'
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

  if (!isOpen) return null

  return (
    <div className="lg:hidden mb-4 animate-in slide-in-from-top-2 duration-200">
      <div className="bg-surface-card rounded-xl border border-border p-4 space-y-4 shadow-md">
        <div>
          <h3 className="text-[10px] font-medium text-txt-tertiary mb-2">{activeTab === 'projects' ? 'CATEGORY' : 'ROLE'}</h3>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { onCategoryChange(cat.id); onToggle() }}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-brand text-white border-brand'
                    : 'bg-surface-sunken text-txt-secondary border-border hover:border-border'
                }`}
              >
                <cat.icon size={12} />
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-[10px] font-medium text-txt-tertiary mb-2">{activeTab === 'projects' ? 'TRENDING' : 'POPULAR SKILLS'}</h3>
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
        {activeTab === 'projects' && (
          <div className="pt-3 border-t border-border">
            <label className="flex items-center gap-2.5 text-sm text-txt-secondary cursor-pointer min-h-[44px]">
              <div className={`w-5 h-5 sm:w-4 sm:h-4 border flex items-center justify-center transition-all ${
                recruitingOnly ? 'bg-indicator-online border-indicator-online' : 'border-border'
              }`}>
                {recruitingOnly && <Check size={10} className="text-white" strokeWidth={3} />}
              </div>
              <input type="checkbox" className="sr-only" checked={recruitingOnly} onChange={(e) => onRecruitingOnlyChange(e.target.checked)} />
              모집 중만 보기
            </label>
          </div>
        )}
      </div>
    </div>
  )
}
