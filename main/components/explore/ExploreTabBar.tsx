'use client'

import React from 'react'
import { LayoutGrid, Users, Search, X, Filter } from 'lucide-react'
import { SORT_OPTIONS, TYPE_FILTERS, PEOPLE_ROLE_FILTERS, PEOPLE_SORT_OPTIONS } from './constants'
import type { ActiveTab, SortBy, TypeFilter, PeopleRoleFilter, PeopleSortBy } from './types'

interface ExploreTabBarProps {
  activeTab: ActiveTab
  onTabChange: (tab: ActiveTab) => void
  sortBy: SortBy
  onSortChange: (sort: SortBy) => void
  typeFilter: TypeFilter
  onTypeFilterChange: (filter: TypeFilter) => void
  peopleRoleFilter: PeopleRoleFilter
  onPeopleRoleFilterChange: (filter: PeopleRoleFilter) => void
  peopleSortBy: PeopleSortBy
  onPeopleSortChange: (sort: PeopleSortBy) => void
  query: string
  projectCount: number
  peopleCount: number
  mobileSearchOpen?: boolean
  onMobileSearchToggle?: () => void
  searchInput?: string
  onSearchInputChange?: (v: string) => void
  isMobileFilterOpen?: boolean
  onMobileFilterToggle?: () => void
}

export function ExploreTabBar({
  activeTab,
  onTabChange,
  sortBy,
  onSortChange,
  typeFilter,
  onTypeFilterChange,
  peopleRoleFilter,
  onPeopleRoleFilterChange,
  peopleSortBy,
  onPeopleSortChange,
  query,
  projectCount,
  peopleCount,
  mobileSearchOpen,
  onMobileSearchToggle,
  searchInput,
  onSearchInputChange,
  isMobileFilterOpen,
  onMobileFilterToggle,
}: ExploreTabBarProps) {
  return (
    <>
      {/* 탭 + 모바일 검색 아이콘 */}
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

      {/* 모바일 인라인 검색 */}
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

      {/* 정렬 옵션 */}
      {activeTab === 'projects' && (
        <div className="flex items-center gap-1 mb-3 overflow-x-auto scrollbar-hide mask-fade-r">
          {SORT_OPTIONS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onSortChange(tab.id as SortBy)}
              className={`shrink-0 flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-xl transition-colors ${
                sortBy === tab.id ? 'bg-surface-sunken text-txt-primary' : 'text-txt-tertiary hover:text-txt-secondary'
              }`}
            >
              <tab.icon size={12} />
              {tab.label}
              {tab.beta && (
                <span className="text-[0.5rem] font-medium bg-brand text-white px-1 py-px leading-none">beta</span>
              )}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'people' && (
        <div className="flex items-center gap-1 mb-3 overflow-x-auto scrollbar-hide mask-fade-r">
          {PEOPLE_SORT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onPeopleSortChange(opt.id as PeopleSortBy)}
              className={`shrink-0 flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-xl transition-colors ${
                peopleSortBy === opt.id ? 'bg-surface-sunken text-txt-primary' : 'text-txt-tertiary hover:text-txt-secondary'
              }`}
            >
              <opt.icon size={12} />
              {opt.label}
              {opt.beta && (
                <span className="text-[0.5rem] font-medium bg-brand text-white px-1 py-px leading-none">beta</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Type filter chips + 모바일 필터 */}
      {activeTab === 'projects' && (
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto scrollbar-hide mask-fade-r">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t.id}
              onClick={() => onTypeFilterChange(t.id as TypeFilter)}
              className={`shrink-0 px-3 py-2 text-xs font-bold border rounded-xl transition-all ${
                typeFilter === t.id
                  ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                  : 'bg-surface-card text-txt-secondary border-border hover:border-border hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]'
              }`}
            >
              {t.label}
            </button>
          ))}
          {onMobileFilterToggle && (
            <button
              onClick={onMobileFilterToggle}
              className={`lg:hidden shrink-0 ml-auto px-3 py-2 text-xs font-bold border rounded-xl transition-all flex items-center gap-1 ${
                isMobileFilterOpen
                  ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                  : 'bg-surface-card text-txt-secondary border-border hover:border-border'
              }`}
            >
              <Filter size={12} />
              필터
            </button>
          )}
        </div>
      )}

      {/* People role filter chips + 모바일 필터 */}
      {activeTab === 'people' && (
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto scrollbar-hide mask-fade-r">
          {PEOPLE_ROLE_FILTERS.map((r) => (
            <button
              key={r.id}
              onClick={() => onPeopleRoleFilterChange(r.id as PeopleRoleFilter)}
              className={`shrink-0 px-3 py-2 text-xs font-bold border rounded-xl transition-all ${
                peopleRoleFilter === r.id
                  ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                  : 'bg-surface-card text-txt-secondary border-border hover:border-border hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]'
              }`}
            >
              {r.label}
            </button>
          ))}
          {onMobileFilterToggle && (
            <button
              onClick={onMobileFilterToggle}
              className={`lg:hidden shrink-0 ml-auto px-3 py-2 text-xs font-bold border rounded-xl transition-all flex items-center gap-1 ${
                isMobileFilterOpen
                  ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                  : 'bg-surface-card text-txt-secondary border-border hover:border-border'
              }`}
            >
              <Filter size={12} />
              필터
            </button>
          )}
        </div>
      )}
    </>
  )
}
