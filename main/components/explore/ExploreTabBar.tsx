'use client'

import React from 'react'
import { LayoutGrid, Users } from 'lucide-react'
import { SORT_OPTIONS, TYPE_FILTERS } from './constants'
import type { ActiveTab, SortBy, TypeFilter } from './types'

interface ExploreTabBarProps {
  activeTab: ActiveTab
  onTabChange: (tab: ActiveTab) => void
  sortBy: SortBy
  onSortChange: (sort: SortBy) => void
  typeFilter: TypeFilter
  onTypeFilterChange: (filter: TypeFilter) => void
  query: string
  projectCount: number
  peopleCount: number
}

export function ExploreTabBar({
  activeTab,
  onTabChange,
  sortBy,
  onSortChange,
  typeFilter,
  onTypeFilterChange,
  query,
  projectCount,
  peopleCount,
}: ExploreTabBarProps) {
  return (
    <>
      {/* 탭 + 정렬 */}
      <div className="flex items-center justify-between border-b-2 border-border-strong mb-6">
        <div className="flex items-center">
          <button
            onClick={() => onTabChange('projects')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 -mb-[2px] transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 ${
              activeTab === 'projects' ? 'border-[#4F46E5] text-[#4F46E5]' : 'border-transparent text-txt-tertiary hover:text-txt-secondary'
            }`}
          >
            <LayoutGrid size={14} />
            프로젝트
            {query && <span className="ml-1 text-[0.625rem] font-mono bg-[#4F46E5]/10 text-[#4F46E5] px-1.5 py-0.5">{projectCount}</span>}
          </button>
          <button
            onClick={() => onTabChange('people')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 -mb-[2px] transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 ${
              activeTab === 'people' ? 'border-[#4F46E5] text-[#4F46E5]' : 'border-transparent text-txt-tertiary hover:text-txt-secondary'
            }`}
          >
            <Users size={14} />
            사람
            {query && <span className="ml-1 text-[0.625rem] font-mono bg-[#4F46E5]/10 text-[#4F46E5] px-1.5 py-0.5">{peopleCount}</span>}
          </button>
        </div>

        {activeTab === 'projects' && (
          <div className="flex items-center gap-1">
            {SORT_OPTIONS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onSortChange(tab.id as SortBy)}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 ${
                  sortBy === tab.id ? 'bg-surface-sunken text-txt-primary' : 'text-txt-tertiary hover:text-txt-secondary'
                }`}
              >
                <tab.icon size={12} />
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Type filter chips */}
      {activeTab === 'projects' && (
        <div className="flex items-center gap-1.5 mb-4">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t.id}
              onClick={() => onTypeFilterChange(t.id as TypeFilter)}
              className={`px-3 py-1.5 text-xs font-bold border transition-all ${
                typeFilter === t.id
                  ? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)]'
                  : 'bg-surface-card text-txt-secondary border-border hover:border-border-strong hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
