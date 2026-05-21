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
      <div className="px-6 py-2 space-y-5 max-h-[60vh] overflow-y-auto">
        {/* Type filter — projects only */}
        {activeTab === 'projects' && (
          <section>
            <h3 className="text-[13px] font-semibold text-txt-secondary mb-3">유형</h3>
            <div className="flex flex-wrap gap-2">
              {TYPE_FILTERS.filter(t => t.id !== 'all').map((t) => (
                <button
                  key={t.id}
                  onClick={() => onTypeFilterChange(typeFilter === t.id ? 'all' : t.id as TypeFilter)}
                  className={`shrink-0 px-3.5 py-2 text-[13px] font-semibold rounded-full transition-all ${
                    typeFilter === t.id
                      ? 'bg-[#5E6AD2] text-white'
                      : 'bg-[#F2F3F5] dark:bg-[#2C2C2E] text-txt-secondary hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C]'
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
            <h3 className="text-[13px] font-semibold text-txt-secondary mb-3">분야</h3>
            <div className="flex flex-wrap gap-2">
              {categories.filter(c => c.id !== 'all').map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onCategoryChange(selectedCategory === cat.id ? 'all' : cat.id)}
                  className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold rounded-full transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#5E6AD2] text-white'
                      : 'bg-[#F2F3F5] dark:bg-[#2C2C2E] text-txt-secondary hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C]'
                  }`}
                >
                  {/* @ts-expect-error lucide icon size prop */}
                  <cat.icon size={13} />
                  {cat.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Role filter — 클럽 탭에서는 불필요 */}
        {activeTab !== 'clubs' && (
        <section>
          <h3 className="text-[13px] font-semibold text-txt-secondary mb-3">역할</h3>
          <div className="flex flex-wrap gap-2">
            {activeTab === 'projects'
              ? PROJECT_ROLE_FILTERS.filter(r => r.id !== 'all').map((r) => (
                  <button
                    key={r.id}
                    onClick={() => onProjectRoleFilterChange(projectRoleFilter === r.id ? 'all' : r.id as ProjectRoleFilter)}
                    className={`shrink-0 px-3.5 py-2 text-[13px] font-semibold rounded-full transition-all ${
                      projectRoleFilter === r.id
                        ? 'bg-[#5E6AD2] text-white'
                        : 'bg-[#F2F3F5] dark:bg-[#2C2C2E] text-txt-secondary hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C]'
                    }`}
                  >
                    {r.label}
                  </button>
                ))
              : PEOPLE_ROLE_FILTERS.filter(r => r.id !== 'all').map((r) => (
                  <button
                    key={r.id}
                    onClick={() => onPeopleRoleFilterChange(peopleRoleFilter === r.id ? 'all' : r.id as PeopleRoleFilter)}
                    className={`shrink-0 px-3.5 py-2 text-[13px] font-semibold rounded-full transition-all ${
                      peopleRoleFilter === r.id
                        ? 'bg-[#5E6AD2] text-white'
                        : 'bg-[#F2F3F5] dark:bg-[#2C2C2E] text-txt-secondary hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C]'
                    }`}
                  >
                    {r.label}
                  </button>
                ))
            }
          </div>
        </section>
        )}

        {/* Recruiting only — projects only */}
        {activeTab === 'projects' && (
          <section>
            <label className="flex items-center gap-3 text-[14px] text-txt-primary cursor-pointer min-h-[44px] bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl px-4 py-3">
              <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                recruitingOnly ? 'bg-[#5E6AD2]' : 'bg-[#E5E5EA] dark:bg-[#3A3A3C]'
              }`}>
                {recruitingOnly && <Check size={12} className="text-white" strokeWidth={3} />}
              </div>
              <input
                type="checkbox"
                className="sr-only"
                checked={recruitingOnly}
                onChange={(e) => onRecruitingOnlyChange(e.target.checked)}
              />
              <span className="font-medium">모집 중만 보기</span>
            </label>
          </section>
        )}
      </div>

      {/* Sticky footer */}
      <div className="flex items-center gap-3 px-6 py-4">
        <button
          onClick={onReset}
          className="px-5 py-3 text-[14px] font-semibold text-txt-secondary bg-[#F2F3F5] dark:bg-[#2C2C2E] rounded-xl hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C] transition-colors"
        >
          초기화
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-3 bg-[#5E6AD2] text-white text-[15px] font-bold rounded-xl hover:bg-[#4B4FB8] transition-colors active:scale-[0.98]"
        >
          적용하기
        </button>
      </div>
    </Modal>
  )
}
