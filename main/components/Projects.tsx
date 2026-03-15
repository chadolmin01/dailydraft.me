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
import { useOpportunities, calculateDaysLeft, type OpportunityWithCreator } from '@/src/hooks/useOpportunities'

export const Projects: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'deadline'>('latest')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: oppData, isLoading } = useOpportunities({ limit: 20 })
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
    <div className="flex-1 overflow-y-auto bg-[#FAFAFA]">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
        <div className="flex gap-6">

          {/* ========== 좌측 사이드바 ========== */}
          <aside className="hidden lg:block w-[220px] flex-shrink-0">
            <div className="sticky top-6 space-y-6">

              {/* 카테고리 */}
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">카테고리</h3>
                <nav className="space-y-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-all ${
                        selectedCategory === cat.id
                          ? 'bg-black text-white'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* 필터 */}
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">필터</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300" />
                    팀원 모집 중
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300" />
                    커피챗 가능
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300" />
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
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black/10"
                  placeholder="프로젝트, 역할, 기술 스택 검색..."
                />
              </div>
              <button className="lg:hidden p-3 bg-white border border-gray-200 rounded-xl">
                <Filter size={18} className="text-gray-600" />
              </button>
            </div>

            {/* 정렬 탭 */}
            <div className="flex items-center gap-1 border-b border-gray-200">
              {[
                { id: 'latest', label: '최신', icon: Clock },
                { id: 'popular', label: '인기', icon: Star },
                { id: 'deadline', label: '마감임박', icon: Flame },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSortBy(tab.id as typeof sortBy)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-[2px] transition-colors ${
                    sortBy === tab.id
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 프로젝트 그리드 */}
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="animate-spin text-gray-400" size={24} />
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
                    <Card key={opp.id} className="group hover:border-gray-300" padding="p-4">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-black group-hover:text-white transition-colors flex-shrink-0">
                          <Zap size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-gray-900 text-sm truncate">{opp.title}</h3>
                            {daysLeft > 0 && (
                              <span className="text-[10px] text-gray-400 flex-shrink-0">D-{daysLeft}</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{opp.description}</p>

                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {opp.needed_roles?.slice(0, 2).map((role: string) => (
                              <span key={role} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg font-medium">{role}</span>
                            ))}
                            {opp.interest_tags?.slice(0, 2).map((tag: string) => (
                              <span key={tag} className="text-[10px] text-gray-400">{tag}</span>
                            ))}
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                            <div className="flex items-center gap-3 text-[10px] text-gray-400">
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
                            <div className="flex items-center gap-2 text-[10px] text-gray-400">
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
          <aside className="hidden xl:block w-[280px] flex-shrink-0">
            <div className="sticky top-6 space-y-6">

              {/* 인기 프로젝트 */}
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Flame size={12} /> 인기 프로젝트
                </h3>
                <div className="space-y-3">
                  {opportunities.slice(0, 5).map((opp: OpportunityWithCreator, idx: number) => (
                    <div
                      key={opp.id}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <span className="text-lg font-bold text-gray-300 w-5">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{opp.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-gray-400">{opp.applications_count || 0}명 지원</span>
                          {opp.creator?.nickname && (
                            <span className="text-[10px] text-gray-400">by {opp.creator.nickname}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA 배너 */}
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-5 text-white">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-4">
                  <Rocket size={20} />
                </div>
                <h3 className="font-bold text-base mb-1">팀원을 찾고 계신가요?</h3>
                <p className="text-gray-400 text-xs mb-4">프로젝트를 등록하고 함께할 팀원을 모집하세요</p>
                <Link
                  href="/projects/new"
                  className="w-full bg-white text-black text-sm font-semibold py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus size={16} />
                  프로젝트 등록하기
                </Link>
              </div>

              {/* 커피챗 안내 */}
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Coffee size={12} /> 커피챗
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
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
