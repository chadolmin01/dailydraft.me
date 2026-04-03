'use client'

import React from 'react'
import { LayoutGrid, Users, Search, X, Filter } from 'lucide-react'
import { SORT_OPTIONS, PEOPLE_SORT_OPTIONS } from './constants'
import type { ActiveTab, SortBy, PeopleSortBy } from './types'

interface ExploreTabBarProps {
  activeTab: ActiveTab
  onTabChange: (tab: ActiveTab) => void
  sortBy: SortBy
  onSortChange: (sort: SortBy) => void
  peopleSortBy: PeopleSortBy
  onPeopleSortChange: (sort: PeopleSortBy) => void
  query: string
  projectCount: number
  peopleCount: number
  mobileSearchOpen?: boolean
  onMobileSearchToggle?: () => void
  searchInput?: string
  onSearchInputChange?: (v: string) => void
  activeFilterCount: number
  onFilterButtonClick: () => void
}

export function ExploreTabBar({
  activeTab,
  onTabChange,
  sortBy,
  onSortChange,
  peopleSortBy,
  onPeopleSortChange,
  query,
  projectCount,
  peopleCount,
  mobileSearchOpen,
  onMobileSearchToggle,
  searchInput,
  onSearchInputChange,
  activeFilterCount,
  onFilterButtonClick,
}: ExploreTabBarProps) {
  return (
    <>
      {/* Tabs + mobile search icon */}
      <div className="border-b-2 border-border mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center shrink-0">
            <button
              onClick={() => onTabChange('projects')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 -mb-[2px] transition-colors ${
                activeTab === 'projects' ? 'border-brand text-brand' : 'border-transparent text-txt-tertiary hover:text-txt-secondary'
              }`}
            >
              <LayoutGrid size={14} />
              프로젝트
              {query && <span className="ml-1 text-[10px] font-mono bg-brand-bg text-brand px-1.5 py-0.5">{projectCount}</span>}
            </button>
            <button
              onClick={() => onTabChange('people')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 -mb-[2px] transition-colors ${
                activeTab === 'people' ? 'border-brand text-brand' : 'border-transparent text-txt-tertiary hover:text-txt-secondary'
              }`}
            >
              <Users size={14} />
              사람
              {query && <span className="ml-1 text-[10px] font-mono bg-brand-bg text-brand px-1.5 py-0.5">{peopleCount}</span>}
            </button>
          </div>
          {onMobileSearchToggle && (
            <button
              onClick={onMobileSearchToggle}
              className={`md:hidden w-10 h-10 flex items-center justify-center transition-colors ${
                mobileSearchOpen ? 'text-brand bg-brand-bg' : 'text-txt-tertiary hover:text-txt-secondary'
              }`}
              aria-label="검색"
            >
              {mobileSearchOpen ? <X size={18} /> : <Search size={18} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile inline search */}
      {mobileSearchOpen && onSearchInputChange && (
        <div className="md:hidden mb-3 animate-in slide-in-from-top-2 duration-150">
          <div className="relative flex items-center bg-surface-card rounded-xl border border-border">
            <Search size={16} className="absolute left-3 text-txt-disabled" />
            <input
              type="text"
              value={searchInput ?? ''}
              onChange={(e) => onSearchInputChange(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-10 py-2.5 text-base sm:text-sm bg-transparent focus:outline-none"
              placeholder="프로젝트, 사람, 기술 검색..."
            />
            {searchInput && (
              <button
                onClick={() => onSearchInputChange('')}
                className="absolute right-3 p-1 text-txt-disabled hover:text-txt-secondary"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sort options + filter button */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide mask-fade-r">
          {activeTab === 'projects' ? (
            SORT_OPTIONS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onSortChange(tab.id as SortBy)}
                className={`shrink-0 flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-xl transition-colors ${
                  sortBy === tab.id ? 'bg-surface-sunken text-txt-primary' : 'text-txt-tertiary hover:text-txt-secondary'
                }`}
              >
                <tab.icon size={12} />
                {tab.label}
              </button>
            ))
          ) : (
            PEOPLE_SORT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onPeopleSortChange(opt.id as PeopleSortBy)}
                className={`shrink-0 flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-xl transition-colors ${
                  peopleSortBy === opt.id ? 'bg-surface-sunken text-txt-primary' : 'text-txt-tertiary hover:text-txt-secondary'
                }`}
              >
                <opt.icon size={12} />
                {opt.label}
              </button>
            ))
          )}
        </div>
        <button
          onClick={onFilterButtonClick}
          className="shrink-0 flex items-center gap-1 px-3 py-2 text-xs font-bold border rounded-xl transition-all bg-surface-card text-txt-secondary border-border hover:border-border hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]"
        >
          <Filter size={12} />
          필터
          {activeFilterCount > 0 && (
            <span className="ml-0.5 min-w-[16px] h-4 flex items-center justify-center text-[10px] font-bold bg-brand text-white rounded-full px-1">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>
    </>
  )
}
