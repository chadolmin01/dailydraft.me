'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Users, Star, Rocket, LayoutGrid, Clock, Flame, ChevronRight, Hash, UserCircle, Sparkles, Zap, Coffee, MessageSquare, FolderOpen, Search, X, Filter, Code2, User } from 'lucide-react'
import { useSearchParams as useNextSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PageContainer } from '@/components/ui/PageContainer'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { DashboardLayout } from '@/components/ui/DashboardLayout'
import { ProjectDetailModal } from '@/components/ProjectDetailModal'
import { ProfileDetailModal } from '@/components/ProfileDetailModal'
import { useOpportunities, type OpportunityWithCreator, calculateDaysLeft } from '@/src/hooks/useOpportunities'
import { usePublicProfiles, type PublicProfile } from '@/src/hooks/usePublicProfiles'
import { useUserRecommendations, type UserRecommendation } from '@/src/hooks/useUserRecommendations'
import { FALLBACK_CATEGORIES, FALLBACK_TRENDING_TAGS, FALLBACK_TALENTS } from '@/src/lib/fallbacks/explore'
import { useAuth } from '@/src/context/AuthContext'

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  all: LayoutGrid,
  'AI/ML': Sparkles,
  SaaS: Zap,
  Fintech: Star,
  HealthTech: Zap,
  Social: Users,
}

// Debounce hook
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export default function ExplorePage() {
  const urlParams = useNextSearchParams()
  const initialQuery = urlParams.get('q') || ''
  const initialScope = urlParams.get('scope') as 'all' | 'projects' | 'people' | 'skills' || 'all'

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [profileByUserId, setProfileByUserId] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('trending')
  const [typeFilter, setTypeFilter] = useState<'all' | 'side_project' | 'startup' | 'study'>('all')
  const [activeTab, setActiveTab] = useState<'projects' | 'people'>('projects')
  const [recruitingOnly, setRecruitingOnly] = useState(false)
  const [searchInput, setSearchInput] = useState(initialQuery)
  const [searchScope, setSearchScope] = useState<'all' | 'projects' | 'people' | 'skills'>(initialScope)
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchQuery = useDebouncedValue(searchInput, 300)
  const { isAuthenticated, user } = useAuth()

  // Close expanded search on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchExpanded(false)
      }
    }
    if (isSearchExpanded) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isSearchExpanded])

  const PAGE_SIZE = 12
  const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE)

  const { data: oppData, isLoading: opportunitiesLoading, isError: oppError, refetch: refetchOpp } = useOpportunities({ limit: displayLimit })
  const opportunities = oppData?.items ?? []
  const totalCount = oppData?.totalCount ?? 0
  const hasMore = displayLimit < totalCount

  const { data: publicProfiles = [], isLoading: profilesLoading, isError: profilesError, refetch: refetchProfiles } = usePublicProfiles({ limit: 12 })
  const { data: sidebarRecs = [] } = useUserRecommendations({ limit: 4 })
  const { data: peopleRecs = [], isLoading: recsLoading } = useUserRecommendations({ limit: 6 })

  const query = searchQuery.toLowerCase().trim()

  // Map opportunities to project card format
  const projectCards = opportunities
    .filter((opp: OpportunityWithCreator) => {
      if (typeFilter !== 'all' && opp.type !== typeFilter) return false
      if (recruitingOnly && opp.status !== 'active') return false
      if (selectedCategory !== 'all') {
        const tags = (opp.interest_tags || []).map(t => t.toLowerCase())
        if (!tags.some(t => t.includes(selectedCategory.toLowerCase()))) return false
      }
      if (query) {
        // When scope is 'people', hide all projects
        if (searchScope === 'people') return false
        const title = (opp.title || '').toLowerCase()
        const desc = (opp.description || '').toLowerCase()
        const tags = (opp.interest_tags || []).join(' ').toLowerCase()
        const roles = (opp.needed_roles || []).join(' ').toLowerCase()
        if (searchScope === 'skills') {
          // Skills scope: search only in tags and roles
          if (!tags.includes(query) && !roles.includes(query)) return false
        } else {
          // 'all' or 'projects' scope: search everything
          if (!title.includes(query) && !desc.includes(query) && !tags.includes(query) && !roles.includes(query)) return false
        }
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'latest') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      return new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime()
    })
    .map((opp: OpportunityWithCreator) => ({
      id: opp.id,
      title: opp.title,
      desc: opp.description || '',
      roles: opp.needed_roles || [],
      tags: (opp.interest_tags || []).slice(0, 3),
      coverImage: (opp.demo_images && opp.demo_images.length > 0) ? opp.demo_images[0] : null,
      daysLeft: calculateDaysLeft(opp.created_at),
      updatedAt: opp.updated_at ?? undefined,
      status: opp.status,
    }))

  // Map profiles to talent card format
  const talentCards = (publicProfiles.length > 0
    ? publicProfiles
        .filter((profile: PublicProfile) => {
          if (!query) return true
          // When scope is 'projects', hide all people
          if (searchScope === 'projects') return false
          const name = (profile.nickname || '').toLowerCase()
          const role = (profile.desired_position || '').toLowerCase()
          const tags = (profile.interest_tags || []).join(' ').toLowerCase()
          if (searchScope === 'skills') {
            // Skills scope: search only in tags
            return tags.includes(query)
          }
          // 'all' or 'people' scope
          return name.includes(query) || role.includes(query) || tags.includes(query)
        })
        .map((profile: PublicProfile) => ({
          id: profile.id,
          name: profile.nickname || 'Anonymous',
          role: profile.desired_position || 'Explorer',
          tags: (profile.interest_tags || []).slice(0, 3),
          status: 'OPEN' as const,
          visionSummary: profile.vision_summary,
          location: profile.location,
        }))
    : FALLBACK_TALENTS.map(t => ({ ...t, visionSummary: undefined, location: undefined })))

  const categories = FALLBACK_CATEGORIES.map((cat) => ({
    ...cat,
    icon: CATEGORY_ICONS[cat.id] || LayoutGrid,
  }))

  const trendingTags = FALLBACK_TRENDING_TAGS

  const getMatchColorClass = (score: number) => {
    if (score >= 80) return 'bg-status-success-bg text-status-success-text'
    if (score >= 60) return 'bg-tag-default-bg text-tag-default-text'
    return 'bg-surface-sunken text-txt-tertiary'
  }

  const getUpdateBadge = (updatedAt: string | undefined) => {
    if (!updatedAt) return null
    const daysAgo = Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24))
    if (daysAgo <= 7) return daysAgo === 0 ? '오늘 업데이트' : `${daysAgo}일 전 업데이트`
    return null
  }

  return (
    <div className="bg-surface-bg min-h-full">
      {/* Featured Hero */}
      <PageContainer size="wide" className="pt-4 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-surface-inverse rounded-xl p-8 flex flex-col justify-end min-h-[20rem] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-surface-inverse/80 to-transparent" />
            <div className="relative z-10">
              <div className="flex gap-2 mb-3">
                <span className="text-xs font-mono font-bold text-txt-inverse border border-txt-inverse/30 px-3 py-1 rounded-full bg-surface-inverse/20 backdrop-blur-sm">PROJECT</span>
              </div>
              <h2 className="text-2xl font-bold text-txt-inverse mb-1">이번 주 추천 프로젝트</h2>
              <p className="text-txt-inverse/60 text-sm">팀원을 찾고 있는 프로젝트를 확인해보세요</p>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="bg-surface-inverse/90 rounded-xl p-6 flex-1 flex flex-col justify-end min-h-[9.375rem]">
              <span className="text-xs font-mono text-txt-inverse/50 mb-1">TRENDING</span>
              <h3 className="text-lg font-bold text-txt-inverse">AI / ML</h3>
              <p className="text-txt-inverse/50 text-xs">12개 프로젝트 모집 중</p>
            </div>
            <div className="bg-accent rounded-xl p-6 flex-1 flex flex-col justify-end min-h-[9.375rem]">
              <span className="text-xs font-mono text-txt-inverse/50 mb-1">NEW</span>
              <h3 className="text-lg font-bold text-txt-inverse">이번 주 신규</h3>
              <p className="text-txt-inverse/50 text-xs">새로 올라온 프로젝트</p>
            </div>
          </div>
        </div>
      </PageContainer>

      {/* Main Content */}
      <DashboardLayout
        size="wide"
        sidebar={
          <div className="space-y-6">
            {/* 카테고리 */}
            <div className="bg-surface-card rounded-xl border border-border p-4">
              <h3 className="text-xs font-bold text-txt-tertiary uppercase tracking-wider mb-3">카테고리</h3>
              <nav className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 ${
                      selectedCategory === cat.id ? 'bg-accent text-txt-inverse' : 'text-txt-secondary hover:bg-surface-sunken'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <cat.icon size={14} />
                      {cat.label}
                    </span>
                    <span className={`text-xs ${selectedCategory === cat.id ? 'text-txt-inverse/60' : 'text-txt-tertiary'}`}>
                      {cat.count > 0 ? cat.count : ''}
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            {/* 트렌딩 태그 */}
            <div className="bg-surface-card rounded-xl border border-border p-4">
              <h3 className="text-xs font-bold text-txt-tertiary uppercase tracking-wider mb-3 flex items-center gap-1">
                <Flame size={12} /> 트렌딩 태그
              </h3>
              <div className="space-y-2">
                {trendingTags.map((item, idx) => (
                  <button
                    key={item.tag}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm text-txt-secondary hover:bg-surface-sunken transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-txt-tertiary text-xs">#{idx + 1}</span>
                      <Hash size={12} className="text-txt-tertiary" />
                      {item.tag}
                    </span>
                    <span className="text-xs text-txt-tertiary">{item.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 필터 */}
            <div className="bg-surface-card rounded-xl border border-border p-4">
              <h3 className="text-xs font-bold text-txt-tertiary uppercase tracking-wider mb-3">필터</h3>
              <label className="flex items-center gap-2 text-sm text-txt-secondary cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-border"
                  checked={recruitingOnly}
                  onChange={(e) => setRecruitingOnly(e.target.checked)}
                />
                모집 중만 보기
              </label>
            </div>
          </div>
        }
        aside={
          <div className="space-y-6">
            {/* 추천 인재 */}
            <div className="bg-surface-card rounded-xl border border-border p-4">
              <h3 className="text-xs font-bold text-txt-tertiary uppercase tracking-wider mb-3 flex items-center gap-1">
                {isAuthenticated && sidebarRecs.length > 0 ? <Sparkles size={12} /> : <UserCircle size={12} />}
                {isAuthenticated && sidebarRecs.length > 0 ? 'AI 추천 인재' : '추천 인재'}
              </h3>
              <div className="space-y-3">
                {isAuthenticated && sidebarRecs.length > 0 ? (
                  sidebarRecs.map((rec: UserRecommendation) => (
                    <div key={rec.user_id} onClick={() => { setSelectedProfileId(rec.user_id); setProfileByUserId(true) }} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-sunken transition-colors cursor-pointer">
                      <div className="w-9 h-9 bg-surface-sunken rounded-full flex items-center justify-center text-xs font-bold text-txt-secondary">
                        {(rec.nickname || '??').substring(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-txt-primary">{rec.nickname}</p>
                        <p className="text-xs text-txt-tertiary truncate">{rec.match_reason}</p>
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${getMatchColorClass(rec.match_score)}`}>
                        {rec.match_score}%
                      </span>
                    </div>
                  ))
                ) : (
                  talentCards.slice(0, 4).map((t) => (
                    <div key={t.id} onClick={() => { setSelectedProfileId(t.id); setProfileByUserId(false) }} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-sunken transition-colors cursor-pointer">
                      <div className="w-9 h-9 bg-surface-sunken rounded-full flex items-center justify-center text-xs font-bold text-txt-secondary">
                        {t.name.substring(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-txt-primary">{t.name}</p>
                        <p className="text-xs text-txt-tertiary">{t.role}</p>
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        t.status === 'OPEN' ? 'bg-status-success-bg text-status-success-text' : 'bg-surface-sunken text-txt-tertiary'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={() => setActiveTab('people')}
                className="w-full mt-3 text-xs text-txt-tertiary hover:text-txt-primary flex items-center justify-center gap-1"
              >
                더 보기 <ChevronRight size={14} />
              </button>
            </div>

            {/* CTA 배너 */}
            <div className="bg-surface-inverse rounded-xl p-5 text-txt-inverse">
              <div className="w-10 h-10 bg-surface-card/10 rounded-lg flex items-center justify-center mb-4">
                <Rocket size={20} />
              </div>
              <h3 className="font-bold text-base mb-1">아이디어가 있나요?</h3>
              <p className="text-txt-inverse/50 text-xs mb-4">팀을 구성하고 프로젝트를 시작하세요</p>
              <Link
                href="/projects/new"
                className="w-full bg-surface-card text-txt-primary text-sm font-semibold py-2 rounded-lg hover:bg-surface-sunken transition-colors block text-center"
              >
                프로젝트 시작하기
              </Link>
            </div>
          </div>
        }
      >
        {/* ── Gemini-style 확장형 검색바 ── */}
        <div ref={searchRef} className="relative mb-6">
          {/* 검색 컨테이너 */}
          <div className={`relative rounded-2xl transition-all duration-200 ${
            isSearchExpanded
              ? 'bg-surface-card shadow-lg ring-1 ring-border-strong/20'
              : 'bg-surface-sunken hover:bg-surface-card hover:shadow-soft'
          }`}>
            {/* 검색 입력 */}
            <div className="relative flex items-center">
              <div className={`absolute left-4 transition-colors ${isSearchExpanded ? 'text-txt-secondary' : 'text-txt-disabled'}`}>
                <Search size={18} />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
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
              {/* 우측: scope 뱃지 + clear */}
              <div className="absolute right-3 flex items-center gap-1.5">
                {searchScope !== 'all' && (
                  <button
                    onClick={() => setSearchScope('all')}
                    className="flex items-center gap-1 text-[0.625rem] font-mono uppercase tracking-wide bg-surface-inverse text-txt-inverse pl-2 pr-1.5 py-0.5 rounded-full hover:bg-accent-hover transition-colors"
                  >
                    {searchScope === 'projects' ? '프로젝트' : searchScope === 'people' ? '사람' : '기술'}
                    <X size={10} />
                  </button>
                )}
                {searchInput && (
                  <button
                    onClick={() => setSearchInput('')}
                    className="p-1.5 text-txt-disabled hover:text-txt-secondary hover:bg-surface-sunken rounded-full transition-colors"
                    aria-label="검색어 지우기"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* 확장 패널 */}
            {isSearchExpanded && (
              <div className="search-expand">
                <div className="mx-4 border-t border-border-subtle" />
                <div className="px-4 pt-3 pb-4 space-y-3">
                  {/* 검색 범위 */}
                  <div>
                    <p className="text-[0.625rem] font-mono uppercase tracking-widest text-txt-disabled mb-2.5">SCOPE</p>
                    <div className="flex flex-wrap gap-1.5">
                      {([
                        { id: 'all', label: '전체', icon: LayoutGrid, desc: '모든 결과' },
                        { id: 'projects', label: '프로젝트', icon: FolderOpen, desc: '제목·설명' },
                        { id: 'people', label: '사람', icon: User, desc: '이름·포지션' },
                        { id: 'skills', label: '기술 스택', icon: Code2, desc: '기술·역할' },
                      ] as const).map((scope) => {
                        const isActive = searchScope === scope.id
                        return (
                          <button
                            key={scope.id}
                            onClick={() => {
                              setSearchScope(scope.id)
                              if (scope.id === 'projects') setActiveTab('projects')
                              else if (scope.id === 'people') setActiveTab('people')
                            }}
                            className={`group/chip flex items-center gap-2 pl-2.5 pr-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                              isActive
                                ? 'bg-surface-inverse text-txt-inverse shadow-sm'
                                : 'bg-surface-sunken text-txt-secondary hover:bg-surface-card hover:shadow-sm hover:ring-1 hover:ring-border'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                              isActive ? 'bg-white/15' : 'bg-surface-card group-hover/chip:bg-surface-elevated'
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

                  {/* 키보드 힌트 */}
                  <div className="flex items-center gap-3 pt-1">
                    <span className="flex items-center gap-1.5 text-[0.625rem] text-txt-disabled">
                      <kbd className="px-1.5 py-0.5 bg-surface-sunken border border-border rounded text-[0.625rem] font-mono">Enter</kbd>
                      검색
                    </span>
                    <span className="flex items-center gap-1.5 text-[0.625rem] text-txt-disabled">
                      <kbd className="px-1.5 py-0.5 bg-surface-sunken border border-border rounded text-[0.625rem] font-mono">Esc</kbd>
                      닫기
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 확장 시 배경 오버레이 */}
          {isSearchExpanded && (
            <div className="fixed inset-0 bg-black/5 -z-10 animate-in fade-in duration-200" />
          )}
        </div>

        {/* 탭 + 정렬 */}
        <div className="flex items-center justify-between border-b border-border mb-6">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-[2px] transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                activeTab === 'projects' ? 'border-accent text-txt-primary' : 'border-transparent text-txt-tertiary hover:text-txt-secondary'
              }`}
            >
              <LayoutGrid size={14} />
              프로젝트
              {query && <span className="ml-1 text-xs text-txt-tertiary">{projectCards.length}</span>}
            </button>
            <button
              onClick={() => setActiveTab('people')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-[2px] transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                activeTab === 'people' ? 'border-accent text-txt-primary' : 'border-transparent text-txt-tertiary hover:text-txt-secondary'
              }`}
            >
              <Users size={14} />
              사람
              {query && <span className="ml-1 text-xs text-txt-tertiary">{talentCards.length}</span>}
            </button>
          </div>

          {activeTab === 'projects' && (
            <div className="flex items-center gap-1">
              {[
                { id: 'trending', label: '트렌딩', icon: Flame },
                { id: 'latest', label: '최신', icon: Clock },
                { id: 'popular', label: '인기', icon: Star },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSortBy(tab.id as typeof sortBy)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 ${
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

        {/* ── Type filter chips ── */}
        {activeTab === 'projects' && (
          <div className="flex items-center gap-1.5 mb-4">
            {([
              { id: 'all', label: '전체' },
              { id: 'side_project', label: '사이드프로젝트' },
              { id: 'startup', label: '스타트업' },
              { id: 'study', label: '스터디' },
            ] as const).map((t) => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  typeFilter === t.id
                    ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                    : 'bg-surface-card text-txt-secondary border-border hover:border-border-strong'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* ── 프로젝트 탭: REF-A 카드 디자인 ── */}
        {activeTab === 'projects' && (
          <section>
            {oppError ? (
              <ErrorState message="프로젝트를 불러오는 데 실패했습니다" onRetry={() => refetchOpp()} />
            ) : opportunitiesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1,2,3,4,5,6].map((i) => (
                  <div key={i} className="bg-surface-card border border-border rounded-xl overflow-hidden h-[21.25rem] flex flex-col animate-pulse">
                    <div className="h-36 shrink-0 bg-surface-sunken" />
                    <div className="px-4 pt-4 flex-1 space-y-3">
                      <div className="h-4 bg-surface-sunken rounded w-3/4" />
                      <div className="h-3 bg-surface-sunken rounded w-full" />
                      <div className="h-3 bg-surface-sunken rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : projectCards.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="등록된 프로젝트가 없습니다"
                description="첫 번째 프로젝트를 만들어 팀원을 모집해보세요"
                actionLabel="프로젝트 만들기"
                actionHref="/projects/new"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projectCards.map((p) => {
                  const updateBadge = getUpdateBadge(p.updatedAt)
                  const isUrgent = p.daysLeft > 0 && p.daysLeft <= 3
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProjectId(p.id)}
                      className="bg-surface-card border border-border rounded-xl overflow-hidden group hover:border-border-strong hover:shadow-sm transition-all cursor-pointer h-[21.25rem] flex flex-col focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                    >
                      {/* 헤더: 커버 — 144px */}
                      <div className="relative h-36 shrink-0 bg-surface-inverse flex items-end p-4">
                        {p.coverImage && (
                          <>
                            <img src={p.coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/30" />
                          </>
                        )}
                        <div className="absolute top-3 left-3 z-[1]">
                          {isUrgent ? (
                            <span className="text-xs bg-status-danger-accent/90 backdrop-blur-sm text-txt-inverse px-2 py-0.5 rounded font-semibold shadow-sm">D-{p.daysLeft} 마감임박</span>
                          ) : (
                            <span className="text-xs bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded font-semibold shadow-sm">모집중</span>
                          )}
                        </div>
                        <div className="absolute top-3 right-3 flex gap-1.5 z-[1]">
                          {updateBadge && (
                            <span className="text-xs bg-black/50 backdrop-blur-sm text-white px-2 py-0.5 rounded font-mono shadow-sm">{updateBadge}</span>
                          )}
                          {!updateBadge && p.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-xs bg-black/40 backdrop-blur-sm text-white px-2 py-0.5 rounded font-medium shadow-sm">{tag}</span>
                          ))}
                        </div>
                        <div className="relative z-[1] w-10 h-10 bg-surface-card rounded-lg flex items-center justify-center shadow-md">
                          <Rocket size={20} className="text-txt-primary" />
                        </div>
                      </div>
                      {/* 본문: 제목+역할+설명 — 120px */}
                      <div className="px-4 pt-4 h-[7.5rem] shrink-0 overflow-hidden">
                        <h3 className="font-semibold text-base text-txt-primary mb-1.5 truncate">{p.title}</h3>
                        <div className="flex items-center gap-1.5 mb-2 overflow-hidden">
                          <span className="text-xs font-mono text-txt-disabled uppercase tracking-wide shrink-0">NEED</span>
                          {p.roles.slice(0, 2).map(role => (
                            <span key={role} className="text-xs bg-tag-default-bg text-tag-default-text px-2 py-0.5 rounded font-medium shrink-0">{role}</span>
                          ))}
                        </div>
                        <p className="text-sm text-txt-secondary line-clamp-2">{p.desc}</p>
                      </div>
                      {/* 푸터: 메타 — 76px */}
                      <div className="px-4 pb-4 h-[4.75rem] shrink-0 flex items-end">
                        <div className="flex items-center justify-between w-full pt-3 border-t border-border-subtle">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-surface-sunken rounded-full" />
                            <span className="text-xs text-txt-tertiary">팀 모집중</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-txt-tertiary">
                            {p.daysLeft > 0 && (
                              <span className={isUrgent ? 'text-status-danger-text font-semibold' : ''}>D-{p.daysLeft}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {hasMore && !opportunitiesLoading && (
              <div className="text-center mt-6">
                <button
                  onClick={() => setDisplayLimit(prev => prev + PAGE_SIZE)}
                  className="px-6 py-2.5 text-sm font-medium text-txt-secondary border border-border rounded-lg hover:bg-surface-sunken transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  더 보기{!searchQuery && selectedCategory === 'all' && !recruitingOnly ? ` (${totalCount - projectCards.length}개 남음)` : ''}
                </button>
              </div>
            )}
          </section>
        )}

        {/* ── 사람 탭: NEW-B 카드 디자인 ── */}
        {activeTab === 'people' && (
          <section>
            {/* AI 추천 팀원 섹션 (로그인 유저만) */}
            {isAuthenticated && peopleRecs.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-bold text-txt-tertiary uppercase tracking-wider mb-4 flex items-center gap-1">
                  <Sparkles size={12} /> AI 추천 팀원
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {peopleRecs.map((rec: UserRecommendation) => (
                    <div
                      key={rec.user_id}
                      onClick={() => { setSelectedProfileId(rec.user_id); setProfileByUserId(true) }}
                      className="bg-surface-card border border-border rounded-xl overflow-hidden group hover:border-border-strong hover:shadow-sm transition-all cursor-pointer h-[13.75rem] flex flex-col focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                    >
                      {/* 헤더: 아바타 + 이름/역할 — 76px */}
                      <div className="px-4 pt-4 h-[4.75rem] shrink-0">
                        <div className="flex gap-3">
                          <div className="w-12 h-12 bg-surface-sunken rounded-xl flex items-center justify-center text-base font-bold text-txt-secondary shrink-0">
                            {(rec.nickname || '??').substring(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="font-semibold text-base text-txt-primary truncate">{rec.nickname}</h3>
                              <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${getMatchColorClass(rec.match_score)}`}>
                                {rec.match_score}%
                              </span>
                            </div>
                            <p className="text-sm text-txt-secondary truncate">{rec.desired_position || 'Explorer'}{rec.location ? ` · ${rec.location}` : ''}</p>
                          </div>
                        </div>
                      </div>
                      {/* 본문: 매칭 이유 + 태그 — 92px */}
                      <div className="px-4 h-[5.75rem] shrink-0 overflow-hidden">
                        <p className="text-sm text-txt-tertiary line-clamp-2 mb-2">{rec.match_reason}</p>
                        {rec.interest_tags.length > 0 && (
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            {rec.interest_tags.map((tag: string) => (
                              <span key={tag} className="text-xs bg-tag-default-bg text-tag-default-text px-2 py-0.5 rounded font-medium shrink-0">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* 푸터 — 52px */}
                      <div className="px-4 pb-4 h-[3.25rem] shrink-0 flex items-end">
                        <div className="flex items-center justify-between w-full pt-2 border-t border-border-subtle">
                          <span className="text-xs text-txt-tertiary">{rec.founder_type || rec.desired_position || 'Explorer'}</span>
                          <span className="text-xs text-status-success-text flex items-center gap-1"><Coffee size={10} /> 커피챗 가능</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Divider */}
                <div className="mt-6 mb-2 flex items-center gap-3">
                  <div className="flex-1 border-t border-border" />
                  <span className="text-xs text-txt-tertiary font-medium">모든 사람</span>
                  <div className="flex-1 border-t border-border" />
                </div>
              </div>
            )}

            {profilesError ? (
              <ErrorState message="프로필을 불러오는 데 실패했습니다" onRetry={() => refetchProfiles()} />
            ) : profilesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1,2,3,4,5,6].map((i) => (
                  <div key={i} className="bg-surface-card border border-border rounded-xl overflow-hidden h-[13.75rem] flex flex-col animate-pulse">
                    <div className="px-4 pt-4 h-[4.75rem] shrink-0 flex gap-3">
                      <div className="w-12 h-12 bg-surface-sunken rounded-xl shrink-0" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-4 bg-surface-sunken rounded w-1/2" />
                        <div className="h-3 bg-surface-sunken rounded w-3/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : talentCards.length === 0 ? (
              <EmptyState
                icon={Users}
                title="등록된 사람이 없습니다"
                description="프로필을 공개하면 여기에 표시돼요"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {talentCards.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => { setSelectedProfileId(t.id); setProfileByUserId(false) }}
                    className="bg-surface-card border border-border rounded-xl overflow-hidden group hover:border-border-strong hover:shadow-sm transition-all cursor-pointer h-[13.75rem] flex flex-col focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  >
                    {/* 헤더: 아바타 + 이름/역할 — 76px */}
                    <div className="px-4 pt-4 h-[4.75rem] shrink-0">
                      <div className="flex gap-3">
                        <div className="w-12 h-12 bg-surface-sunken rounded-xl flex items-center justify-center text-base font-bold text-txt-secondary shrink-0">
                          {t.name.substring(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-semibold text-base text-txt-primary truncate">{t.name}</h3>
                            <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${
                              t.status === 'OPEN' ? 'bg-status-success-bg text-status-success-text'
                              : t.status === 'BUSY' ? 'bg-status-neutral-bg text-status-neutral-text'
                              : 'bg-surface-sunken text-txt-tertiary'
                            }`}>
                              {t.status}
                            </span>
                          </div>
                          <p className="text-sm text-txt-secondary truncate">{t.role}{t.location ? ` · ${t.location}` : ''}</p>
                        </div>
                      </div>
                    </div>
                    {/* 본문: 바이오 + 스킬 — 92px */}
                    <div className="px-4 h-[5.75rem] shrink-0 overflow-hidden">
                      {t.visionSummary && (
                        <p className="text-sm text-txt-tertiary line-clamp-2 mb-2">{t.visionSummary}</p>
                      )}
                      {t.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          {t.tags.map(tag => (
                            <span key={tag} className="text-xs bg-tag-default-bg text-tag-default-text px-2 py-0.5 rounded font-medium shrink-0">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* 푸터: 상태 — 52px */}
                    <div className="px-4 pb-4 h-[3.25rem] shrink-0 flex items-end">
                      <div className="flex items-center justify-between w-full pt-2 border-t border-border-subtle">
                        <span className="text-xs text-txt-tertiary">{t.role}</span>
                        <span className="text-xs text-status-success-text flex items-center gap-1"><Coffee size={10} /> 커피챗 가능</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </DashboardLayout>

      <ProjectDetailModal
        projectId={selectedProjectId}
        onClose={() => setSelectedProjectId(null)}
      />

      <ProfileDetailModal
        profileId={selectedProfileId}
        byUserId={profileByUserId}
        onClose={() => setSelectedProfileId(null)}
      />
    </div>
  )
}
