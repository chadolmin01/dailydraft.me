'use client'

import React from 'react'
import { LayoutGrid, Users } from 'lucide-react'
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
}: ExploreTabBarProps) {
  return (
    <>
      {/* 탭 + 정렬 — 모바일에서 세로 배치 */}
      <div className="border-b-2 border-border-strong mb-4">
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
              {query && <span className="ml-1 text-[0.625rem] font-mono bg-brand-bg text-brand px-1.5 py-0.5">{projectCount}</span>}
            </button>
            <button
              onClick={() => onTabChange('people')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 -mb-[2px] transition-colors ${
                activeTab === 'people' ? 'border-brand text-brand' : 'border-transparent text-txt-tertiary hover:text-txt-secondary'
              }`}
            >
              <Users size={14} />
              사람
              {query && <span className="ml-1 text-[0.625rem] font-mono bg-brand-bg text-brand px-1.5 py-0.5">{peopleCount}</span>}
            </button>
          </div>
        </div>
      </div>

      {/* 정렬 옵션 — 별도 줄 */}
      {activeTab === 'projects' && (
        <div className="flex items-center gap-1 mb-3 overflow-x-auto">
          {SORT_OPTIONS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onSortChange(tab.id as SortBy)}
              className={`shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                sortBy === tab.id ? 'bg-surface-sunken text-txt-primary' : 'text-txt-tertiary hover:text-txt-secondary'
              }`}
            >
              <tab.icon size={12} />
              {tab.label}
              {tab.beta && (
                <span className="text-[0.5rem] font-mono font-bold bg-brand text-white px-1 py-px leading-none uppercase">beta</span>
              )}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'people' && (
        <div className="flex items-center gap-1 mb-3 overflow-x-auto">
          {PEOPLE_SORT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onPeopleSortChange(opt.id as PeopleSortBy)}
              className={`shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                peopleSortBy === opt.id ? 'bg-surface-sunken text-txt-primary' : 'text-txt-tertiary hover:text-txt-secondary'
              }`}
            >
              <opt.icon size={12} />
              {opt.label}
              {opt.beta && (
                <span className="text-[0.5rem] font-mono font-bold bg-brand text-white px-1 py-px leading-none uppercase">beta</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Type filter chips */}
      {activeTab === 'projects' && (
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t.id}
              onClick={() => onTypeFilterChange(t.id as TypeFilter)}
              className={`shrink-0 px-3 py-1.5 text-xs font-bold border transition-all ${
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

      {/* People role filter chips */}
      {activeTab === 'people' && (
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto">
          {PEOPLE_ROLE_FILTERS.map((r) => (
            <button
              key={r.id}
              onClick={() => onPeopleRoleFilterChange(r.id as PeopleRoleFilter)}
              className={`shrink-0 px-3 py-1.5 text-xs font-bold border transition-all ${
                peopleRoleFilter === r.id
                  ? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)]'
                  : 'bg-surface-card text-txt-secondary border-border hover:border-border-strong hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
