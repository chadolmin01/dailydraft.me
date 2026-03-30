'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { SEARCH_SCOPES } from './constants'
import type { SearchScope, ActiveTab } from './types'

interface ExploreSearchBarProps {
  searchInput: string
  onSearchInputChange: (value: string) => void
  searchScope: SearchScope
  onSearchScopeChange: (scope: SearchScope) => void
  onScopeSelectTab: (tab: ActiveTab) => void
}

export function ExploreSearchBar({
  searchInput,
  onSearchInputChange,
  searchScope,
  onSearchScopeChange,
  onScopeSelectTab,
}: ExploreSearchBarProps) {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchExpanded(false)
      }
    }
    if (isSearchExpanded) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isSearchExpanded])

  return (
    <div ref={searchRef} className="relative mb-6">
      <div className={`relative transition-all duration-200 ${
        isSearchExpanded
          ? 'bg-surface-card shadow-solid-sm border border-brand/40'
          : 'bg-surface-card rounded-xl border border-border hover:shadow-sharp hover:border-border'
      }`}>
        <div className="relative flex items-center">
          <div className={`absolute left-4 transition-colors ${isSearchExpanded ? 'text-txt-secondary' : 'text-txt-disabled'}`}>
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            onFocus={() => setIsSearchExpanded(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { setIsSearchExpanded(false); (e.target as HTMLInputElement).blur() }
              if (e.key === 'Enter') setIsSearchExpanded(false)
            }}
            className={`w-full bg-transparent text-sm focus:outline-none transition-all ${
              isSearchExpanded ? 'pl-11 pr-24 py-3.5' : 'pl-11 pr-24 py-3'
            }`}
            placeholder={
              searchScope === 'projects' ? '프로젝트 이름, 설명으로 검색...'
              : searchScope === 'people' ? '이름, 포지션으로 검색...'
              : searchScope === 'skills' ? 'React, Python, Figma...'
              : '프로젝트, 사람, 기술 스택 검색...'
            }
          />
          <div className="absolute right-3 flex items-center gap-1.5">
            {searchScope !== 'all' && (
              <button
                onClick={() => onSearchScopeChange('all')}
                className="flex items-center gap-1 text-[0.625rem] bg-surface-inverse text-txt-inverse pl-2 pr-1.5 py-0.5 hover:bg-accent-hover transition-colors"
              >
                {searchScope === 'projects' ? '프로젝트' : searchScope === 'people' ? '사람' : '기술'}
                <X size={10} />
              </button>
            )}
            {searchInput && (
              <button
                onClick={() => onSearchInputChange('')}
                className="p-3 sm:p-1.5 text-txt-disabled hover:text-txt-secondary hover:bg-surface-sunken transition-colors"
                aria-label="검색어 지우기"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {isSearchExpanded && (
          <div className="search-expand">
            <div className="mx-4 border-t border-border-subtle" />
            <div className="px-4 pt-3 pb-4 space-y-3">
              <div>
                <p className="text-[0.625rem] text-txt-disabled mb-2.5">SCOPE</p>
                <div className="flex flex-wrap gap-1.5">
                  {SEARCH_SCOPES.map((scope) => {
                    const isActive = searchScope === scope.id
                    return (
                      <button
                        key={scope.id}
                        onClick={() => {
                          onSearchScopeChange(scope.id)
                          if (scope.id === 'projects') onScopeSelectTab('projects')
                          else if (scope.id === 'people') onScopeSelectTab('people')
                        }}
                        className={`group/chip flex items-center gap-2 pl-2.5 pr-3.5 py-2 text-xs font-medium transition-all border ${
                          isActive
                            ? 'bg-brand text-white border-brand shadow-solid-sm'
                            : 'bg-surface-sunken text-txt-secondary border-border hover:bg-surface-card hover:border-border hover:shadow-sharp'
                        }`}
                      >
                        <div className={`w-6 h-6 flex items-center justify-center transition-colors border ${
                          isActive ? 'bg-white/15 border-white/20' : 'bg-surface-card border-border group-hover/chip:bg-surface-elevated'
                        }`}>
                          <scope.icon size={13} />
                        </div>
                        <div className="text-left">
                          <span className="block leading-tight">{scope.label}</span>
                          <span className={`block text-[0.625rem] leading-tight ${isActive ? 'text-txt-inverse/50' : 'text-txt-disabled'}`}>{scope.desc}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <span className="flex items-center gap-1.5 text-[0.625rem] text-txt-disabled">
                  <kbd className="px-1.5 py-0.5 bg-surface-sunken rounded-xl border border-border rounded text-[0.625rem] font-mono">Enter</kbd>
                  검색
                </span>
                <span className="flex items-center gap-1.5 text-[0.625rem] text-txt-disabled">
                  <kbd className="px-1.5 py-0.5 bg-surface-sunken rounded-xl border border-border rounded text-[0.625rem] font-mono">Esc</kbd>
                  닫기
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {isSearchExpanded && (
        <div className="fixed inset-0 bg-black/5 -z-10 animate-in fade-in duration-200" />
      )}
    </div>
  )
}
