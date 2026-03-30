'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Card } from './ui/Card'
import {
  Search,
  Filter,
  Zap,
  LayoutGrid,
  Loader2,
  Clock,
  Star,
  Flame,
  ChevronRight,
  Users,
  Rocket,
  Plus,
  MapPin,
  Coffee,
  FolderOpen,
} from 'lucide-react'
import { EmptyState } from './ui/EmptyState'
import { ErrorState } from './ui/ErrorState'
import { useOpportunities, calculateDaysLeft, type OpportunityWithCreator } from '@/src/hooks/useOpportunities'

export const Projects: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'deadline'>('latest')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: oppData, isLoading, isError, refetch } = useOpportunities({ limit: 20 })
  const opportunities = oppData?.items ?? []

  // 클라이언트 필터링
  const filtered = opportunities.filter((opp: OpportunityWithCreator) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!opp.title.toLowerCase().includes(q) && !opp.description?.toLowerCase().includes(q)) return false
    }
    if (selectedCategory !== 'all') {
      if (!opp.interest_tags?.includes(selectedCategory)) return false
    }
    return true
  })

  // 정렬
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'latest') return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
    if (sortBy === 'popular') return (b.applications_count || 0) - (a.applications_count || 0)
    if (sortBy === 'deadline') return calculateDaysLeft(a.created_at) - calculateDaysLeft(b.created_at)
    return 0
  })

  const categories = [
    { id: 'all', label: '전체' },
    { id: 'AI/ML', label: 'AI / ML' },
    { id: 'SaaS', label: 'SaaS' },
    { id: 'mobile', label: '모바일' },
    { id: 'web', label: '웹' },
    { id: 'blockchain', label: '블록체인' },
  ]

  return (
    <div className="flex-1 overflow-y-auto bg-surface-bg">
      <div className="max-w-[87.5rem] mx-auto px-4 lg:px-6 py-6">
        <div className="flex gap-6">

          {/* ========== 좌측 사이드바 ========== */}
          <aside className="hidden lg:block w-[13.75rem] flex-shrink-0">
            <div className="sticky top-6 space-y-6">

              {/* 카테고리 */}
              <div className="bg-surface-card border border-border-strong p-4">
                <h3 className="text-[0.625rem] font-medium text-txt-tertiary mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-surface-inverse" />
                  카테고리
                </h3>
                <nav className="space-y-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium transition-all ${
                        selectedCategory === cat.id
                          ? 'bg-surface-inverse text-txt-inverse shadow-solid-sm'
                          : 'text-txt-secondary hover:bg-surface-sunken'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* 필터 */}
              <div className="bg-surface-card border border-border-strong p-4">
                <h3 className="text-[0.625rem] font-medium text-txt-tertiary mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-brand" />
                  필터
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-txt-secondary cursor-pointer">
                    <input type="checkbox" className="border border-border-strong" />
                    팀원 모집 중
                  </label>
                  <label className="flex items-center gap-2 text-sm text-txt-secondary cursor-pointer">
                    <input type="checkbox" className="border border-border-strong" />
                    커피챗 가능
                  </label>
                  <label className="flex items-center gap-2 text-sm text-txt-secondary cursor-pointer">
                    <input type="checkbox" className="border border-border-strong" />
                    이번 주 신규
                  </label>
                </div>
              </div>

            </div>
          </aside>

          {/* ========== 메인 콘텐츠 ========== */}
          <main className="flex-1 min-w-0 space-y-6">

            {/* 검색바 */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-txt-tertiary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-surface-card border border-border-strong text-sm font-mono focus:outline-none focus:border-brand placeholder:text-txt-disabled"
                  placeholder="프로젝트, 역할, 기술 스택 검색..."
                />
              </div>
              <button className="lg:hidden p-3 bg-surface-card border border-border-strong hover:bg-surface-sunken transition-colors">
                <Filter size={18} className="text-txt-secondary" />
              </button>
            </div>

            {/* 정렬 탭 */}
            <div className="flex items-center gap-1 border-b border-border-strong">
              {[
                { id: 'latest', label: '최신', icon: Clock },
                { id: 'popular', label: '인기', icon: Star },
                { id: 'deadline', label: '마감임박', icon: Flame },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSortBy(tab.id as typeof sortBy)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-[0.625rem] font-medium border-b -mb-px transition-colors ${
                    sortBy === tab.id
                      ? 'border-surface-inverse text-txt-primary'
                      : 'border-transparent text-txt-tertiary hover:text-txt-secondary'
                  }`}
                >
                  <tab.icon size={12} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 프로젝트 그리드 */}
            {isError ? (
              <ErrorState message="프로젝트를 불러오는 데 실패했습니다" onRetry={() => refetch()} />
            ) : isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="animate-spin text-txt-tertiary" size={24} />
              </div>
            ) : sorted.length === 0 ? (
              searchQuery ? (
                <EmptyState
                  icon={Search}
                  title="검색 결과가 없습니다"
                  description="다른 키워드로 검색해보세요"
                />
              ) : (
                <EmptyState
                  icon={FolderOpen}
                  title="아직 등록된 프로젝트가 없습니다"
                  description="첫 번째 프로젝트를 등록하고 팀원을 찾아보세요"
                  actionLabel="프로젝트 만들기"
                  actionHref="/projects/new"
                />
              )
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sorted.map((opp: OpportunityWithCreator) => {
                  const daysLeft = calculateDaysLeft(opp.created_at)
                  return (
                    <Card key={opp.id} className="group hover:shadow-sharp relative" padding="p-4">
                      {/* Corner marks */}
                      <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-border-strong pointer-events-none" />
                      <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-border-strong pointer-events-none" />
                      <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-border-strong pointer-events-none" />
                      <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-border-strong pointer-events-none" />
                      <div className="flex gap-3">
                        <div className="w-10 h-10 bg-surface-sunken border border-border-strong flex items-center justify-center text-txt-secondary group-hover:bg-surface-inverse group-hover:text-txt-inverse transition-colors flex-shrink-0">
                          <Zap size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-txt-primary text-sm truncate">{opp.title}</h3>
                            {daysLeft > 0 && (
                              <span className="text-[0.625rem] font-mono font-bold text-status-danger-text bg-status-danger-bg px-1.5 py-0.5 border border-status-danger-text/20 flex-shrink-0">D-{daysLeft}</span>
                            )}
                          </div>
                          <p className="text-xs text-txt-secondary mt-1 line-clamp-2">{opp.description}</p>

                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {opp.needed_roles?.slice(0, 2).map((role: string) => (
                              <span key={role} className="text-[0.625rem] font-mono font-bold bg-status-info-bg text-status-info-text px-2 py-0.5 border border-border">{role}</span>
                            ))}
                            {opp.interest_tags?.slice(0, 2).map((tag: string) => (
                              <span key={tag} className="text-[0.625rem] font-mono text-txt-tertiary">{tag}</span>
                            ))}
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-dashed border-border">
                            <div className="flex items-center gap-3 text-[0.625rem] font-mono text-txt-tertiary">
                              {opp.creator?.nickname && (
                                <span className="flex items-center gap-1">
                                  <Users size={10} />
                                  {opp.creator.nickname}
                                </span>
                              )}
                              {opp.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin size={10} />
                                  {opp.location}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[0.625rem] font-mono text-txt-tertiary">
                              <span>{opp.applications_count || 0}명 지원</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </main>

          {/* ========== 우측 사이드바 ========== */}
          <aside className="hidden xl:block w-[17.5rem] flex-shrink-0">
            <div className="sticky top-6 space-y-6">

              {/* 인기 프로젝트 */}
              <div className="bg-surface-card border border-border-strong p-4">
                <h3 className="text-[0.625rem] font-medium text-txt-tertiary mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-status-danger-text" />
                  <Flame size={10} /> 인기 프로젝트
                </h3>
                <div className="space-y-1">
                  {opportunities.slice(0, 5).map((opp: OpportunityWithCreator, idx: number) => (
                    <div
                      key={opp.id}
                      className="flex items-start gap-3 p-2 hover:bg-surface-sunken transition-colors cursor-pointer border-b border-dashed border-border last:border-b-0"
                    >
                      <span className="text-lg font-mono font-bold text-txt-disabled w-5">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-txt-primary truncate">{opp.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[0.625rem] font-mono text-txt-tertiary">{opp.applications_count || 0}명 지원</span>
                          {opp.creator?.nickname && (
                            <span className="text-[0.625rem] font-mono text-txt-tertiary">by {opp.creator.nickname}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA 배너 */}
              <div className="bg-surface-inverse border border-surface-inverse p-5 text-txt-inverse shadow-brutal">
                <div className="w-10 h-10 border border-white/20 flex items-center justify-center mb-4">
                  <Rocket size={20} />
                </div>
                <h3 className="font-bold text-base mb-1">팀원을 찾고 계신가요?</h3>
                <p className="text-txt-disabled text-xs mb-4 font-mono">프로젝트를 등록하고 함께할 팀원을 모집하세요</p>
                <Link
                  href="/projects/new"
                  className="w-full bg-white text-surface-inverse text-sm font-bold py-2 border border-white hover:bg-surface-sunken transition-all flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                >
                  <Plus size={16} />
                  프로젝트 등록하기
                </Link>
              </div>

              {/* 커피챗 안내 */}
              <div className="bg-surface-card border border-dashed border-border p-4">
                <h3 className="text-[0.625rem] font-medium text-txt-tertiary mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-status-warning-text" />
                  <Coffee size={10} /> 커피챗
                </h3>
                <p className="text-xs text-txt-secondary leading-relaxed">
                  관심 있는 프로젝트의 리더에게 커피챗을 요청해보세요. 부담 없이 이야기를 나눌 수 있습니다.
                </p>
              </div>

            </div>
          </aside>

        </div>
      </div>
    </div>
  )
}
