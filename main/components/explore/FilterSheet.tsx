'use client'

import React from 'react'
import { Check } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { TYPE_FILTERS, PROJECT_ROLE_FILTERS, PEOPLE_ROLE_FILTERS } from './constants'
import type { ActiveTab, TypeFilter, ProjectRoleFilter, PeopleRoleFilter, CategoryItem } from './types'

interface FilterSheetProps {
  isOpen: boolean
  onClose: () => void
  activeTab: ActiveTab
  // Project filters
  typeFilter: TypeFilter
  onTypeFilterChange: (f: TypeFilter) => void
  projectRoleFilter: ProjectRoleFilter
  onProjectRoleFilterChange: (f: ProjectRoleFilter) => void
  categories: CategoryItem[]
  selectedCategory: string
  onCategoryChange: (id: string) => void
  recruitingOnly: boolean
  onRecruitingOnlyChange: (v: boolean) => void
  // People filters
  peopleRoleFilter: PeopleRoleFilter
  onPeopleRoleFilterChange: (f: PeopleRoleFilter) => void
  // Reset
  onReset: () => void
}

export function FilterSheet({
  isOpen,
  onClose,
  activeTab,
  typeFilter,
  onTypeFilterChange,
  projectRoleFilter,
  onProjectRoleFilterChange,
  categories,
  selectedCategory,
  onCategoryChange,
  recruitingOnly,
  onRecruitingOnlyChange,
  peopleRoleFilter,
  onPeopleRoleFilterChange,
  onReset,
}: FilterSheetProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="필터" size="md">
      <div className="px-6 py-4 space-y-6 max-h-[60vh] overflow-y-auto">
        {/* Type filter — projects only */}
        {activeTab === 'projects' && (
          <section>
            <h3 className="text-[10px] font-mono uppercase text-txt-tertiary tracking-wider mb-2.5">유형</h3>
            <div className="flex flex-wrap gap-1.5">
              {TYPE_FILTERS.filter(t => t.id !== 'all').map((t) => (
                <button
                  key={t.id}
                  onClick={() => onTypeFilterChange(typeFilter === t.id ? 'all' : t.id as TypeFilter)}
                  className={`shrink-0 px-3 py-2 text-xs font-bold border rounded-xl transition-all ${
                    typeFilter === t.id
                      ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                      : 'bg-surface-card text-txt-secondary border-border hover:border-border hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Category filter — projects only */}
        {activeTab === 'projects' && (
          <section>
            <h3 className="text-[10px] font-mono uppercase text-txt-tertiary tracking-wider mb-2.5">분야</h3>
            <div className="flex flex-wrap gap-1.5">
              {categories.filter(c => c.id !== 'all').map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onCategoryChange(selectedCategory === cat.id ? 'all' : cat.id)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-bold border rounded-xl transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                      : 'bg-surface-card text-txt-secondary border-border hover:border-border hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]'
                  }`}
                >
                  <cat.icon size={12} />
                  {cat.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Role filter */}
        <section>
          <h3 className="text-[10px] font-mono uppercase text-txt-tertiary tracking-wider mb-2.5">역할</h3>
          <div className="flex flex-wrap gap-1.5">
            {activeTab === 'projects'
              ? PROJECT_ROLE_FILTERS.filter(r => r.id !== 'all').map((r) => (
                  <button
                    key={r.id}
                    onClick={() => onProjectRoleFilterChange(projectRoleFilter === r.id ? 'all' : r.id as ProjectRoleFilter)}
                    className={`shrink-0 px-3 py-2 text-xs font-bold border rounded-xl transition-all ${
                      projectRoleFilter === r.id
                        ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                        : 'bg-surface-card text-txt-secondary border-border hover:border-border hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]'
                    }`}
                  >
                    {r.label}
                  </button>
                ))
              : PEOPLE_ROLE_FILTERS.filter(r => r.id !== 'all').map((r) => (
                  <button
                    key={r.id}
                    onClick={() => onPeopleRoleFilterChange(peopleRoleFilter === r.id ? 'all' : r.id as PeopleRoleFilter)}
                    className={`shrink-0 px-3 py-2 text-xs font-bold border rounded-xl transition-all ${
                      peopleRoleFilter === r.id
                        ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                        : 'bg-surface-card text-txt-secondary border-border hover:border-border hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]'
                    }`}
                  >
                    {r.label}
                  </button>
                ))
            }
          </div>
        </section>

        {/* Recruiting only — projects only */}
        {activeTab === 'projects' && (
          <section className="pt-2 border-t border-border">
            <label className="flex items-center gap-2.5 text-sm text-txt-secondary cursor-pointer min-h-[44px]">
              <div className={`w-5 h-5 sm:w-4 sm:h-4 border rounded flex items-center justify-center transition-all ${
                recruitingOnly ? 'bg-surface-inverse border-surface-inverse' : 'border-border'
              }`}>
                {recruitingOnly && <Check size={10} className="text-txt-inverse" strokeWidth={3} />}
              </div>
              <input
                type="checkbox"
                className="sr-only"
                checked={recruitingOnly}
                onChange={(e) => onRecruitingOnlyChange(e.target.checked)}
              />
              모집 중만 보기
            </label>
          </section>
        )}
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 flex items-center justify-between px-6 py-4 border-t border-border bg-surface-elevated">
        <button
          onClick={onReset}
          className="text-xs font-bold text-txt-tertiary hover:text-txt-secondary transition-colors"
        >
          초기화
        </button>
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-surface-inverse text-txt-inverse text-sm font-bold rounded-xl hover:opacity-90 transition-opacity"
        >
          적용하기
        </button>
      </div>
    </Modal>
  )
}
