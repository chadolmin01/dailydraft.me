'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence } from 'framer-motion'
import { LayoutGrid, Users, Sparkles, Filter } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useSearchParams as useNextSearchParams, useRouter, usePathname } from 'next/navigation'
import { DashboardLayout } from '@/components/ui/DashboardLayout'
import { SkeletonGrid, SkeletonSidebar } from '@/components/ui/Skeleton'
import { ProfileCompletionBanner } from '@/components/ui/ProfileCompletionBanner'
import { AiMatchingNudgeCard } from '@/components/explore/AiMatchingNudgeCard'
import { StarterGuideCard } from '@/components/starter-guide/StarterGuideCard'
import { useStarterGuide } from '@/src/hooks/useStarterGuide'

const ModalLoadingFallback = () => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-modal-backdrop">
    <div className="bg-surface-card rounded-xl border border-border px-6 py-4 shadow-lg">
      <span className="text-sm text-txt-secondary font-mono">로딩 중...</span>
    </div>
  </div>
)

const ProjectDetailModal = dynamic(
  () => import('@/components/ProjectDetailModal').then(m => ({ default: m.ProjectDetailModal })),
  { ssr: false, loading: ModalLoadingFallback }
)
import { ProfileDetailModal } from '@/components/ProfileDetailModal'
import { useInfiniteOpportunities, type OpportunityWithCreator, calculateDaysLeft, OPP_WITH_CREATOR_SELECT } from '@/src/hooks/useOpportunities'
import { cleanNickname } from '@/src/lib/clean-nickname'
import { useInfinitePublicProfiles, type PublicProfile } from '@/src/hooks/usePublicProfiles'
import { useUserRecommendations, type UserRecommendation } from '@/src/hooks/useUserRecommendations'
import { FALLBACK_CATEGORIES, FALLBACK_TRENDING_TAGS } from '@/src/lib/fallbacks/explore'
import { PEOPLE_ROLE_FILTERS, PROJECT_ROLE_FILTERS, PEOPLE_CATEGORY_ICONS } from '@/components/explore/constants'
import { positionLabel } from '@/src/constants/roles'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/src/lib/supabase/client'
import { useAuth } from '@/src/context/AuthContext'
import { useProfile } from '@/src/hooks/useProfile'
import { opportunityKeys } from '@/src/hooks/useOpportunities'
import { CATEGORY_ICONS, PAGE_SIZE, PEOPLE_PAGE_SIZE, TYPE_FILTERS } from './constants'
import {
  ExploreHeroCarousel,
  ExploreSearchBar,
  ExploreSidebar,
  ExploreTabBar,
  ExploreProjectGrid,
  ExplorePeopleGrid,
} from '@/components/explore'
import { FilterSheet } from '@/components/explore/FilterSheet'
import { ActiveFilterChips } from '@/components/explore/ActiveFilterChips'
import type { ActiveTab, SortBy, TypeFilter, SearchScope, PeopleRoleFilter, PeopleSortBy, ProjectRoleFilter, ActiveFilterChip } from '@/components/explore/types'

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export default function ExplorePageClient() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <div className="hidden lg:block w-56 shrink-0"><SkeletonSidebar /></div>
          <div className="flex-1"><SkeletonGrid count={6} cols={3} /></div>
        </div>
      </div>
    }>
      <ExplorePageContent />
    </Suspense>
  )
}

function ExplorePageContent() {
  const searchParams = useNextSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const initialQuery = searchParams.get('q') || ''
  const initialScope = searchParams.get('scope') as SearchScope || 'all'

  // ── Modal state: URL이 single source of truth ──
  const selectedProjectId = searchParams.get('project')
  const selectedProfileId = searchParams.get('profile')
  const profileByUserId = searchParams.get('profileBy') === 'userId'

  // Coffee chat: 일회성 transient state (URL에서 읽고 즉시 제거)
  const [initialCoffeeChatOpen, setInitialCoffeeChatOpen] = useState(false)
  const [initialCoffeeChatMessage, setInitialCoffeeChatMessage] = useState<string | undefined>(undefined)
  const coffeeChatHandledRef = useRef(false)

  // ref로 최신 searchParams 추적 (useCallback 안정성 유지)
  const searchParamsRef = useRef(searchParams)
  searchParamsRef.current = searchParams

  // URL params 업데이트 헬퍼 (stable reference)
  const replaceParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParamsRef.current.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) params.delete(key)
      else params.set(key, value)
    }
    const qs = params.toString()
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
  }, [pathname, router])

  // coffeeChat 딥링크 처리 (최초 1회)
  useEffect(() => {
    if (coffeeChatHandledRef.current) return
    const coffeeChat = searchParams.get('coffeeChat')
    const msg = searchParams.get('msg')
    if (coffeeChat) {
      coffeeChatHandledRef.current = true
      setInitialCoffeeChatOpen(true)
      if (msg) setInitialCoffeeChatMessage(decodeURIComponent(msg))
      replaceParams({ profile: coffeeChat, profileBy: 'userId', coffeeChat: null, msg: null })
    }
  }, [searchParams, replaceParams])

  // ── State ──
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState<SortBy>('trending')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [activeTab, setActiveTab] = useState<ActiveTab>('projects')
  const [recruitingOnly, setRecruitingOnly] = useState(false)
  const [peopleRoleFilter, setPeopleRoleFilter] = useState<PeopleRoleFilter>('all')
  const [projectRoleFilter, setProjectRoleFilter] = useState<ProjectRoleFilter>('all')
  const [peopleSortBy, setPeopleSortBy] = useState<PeopleSortBy>('latest')
  const [searchInput, setSearchInput] = useState(initialQuery)
  const [searchScope, setSearchScope] = useState<SearchScope>(initialScope)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  const searchQuery = useDebouncedValue(searchInput, 300)
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth()
  const { data: profile } = useProfile()
  const queryClient = useQueryClient()
  const guide = useStarterGuide()

  // Starter guide: completion toast
  useEffect(() => {
    if (guide.justCompleted) {
      toast.success('시작 가이드를 모두 완료했어요! 🎉')
    }
  }, [guide.justCompleted])

  // Sync search to URL (preserves modal params)
  useEffect(() => {
    const params = new URLSearchParams(searchParamsRef.current.toString())
    if (searchQuery) params.set('q', searchQuery)
    else params.delete('q')
    if (searchScope !== 'all') params.set('scope', searchScope)
    else params.delete('scope')
    const qs = params.toString()
    const newPath = `${pathname}${qs ? `?${qs}` : ''}`
    const currentQs = searchParamsRef.current.toString()
    const currentPath = `${pathname}${currentQs ? `?${currentQs}` : ''}`
    if (newPath !== currentPath) {
      router.replace(newPath, { scroll: false })
    }
  }, [searchQuery, searchScope, pathname, router])

  // ── Data ──
  const {
    data: oppPages,
    isLoading: opportunitiesLoading,
    isError: oppError,
    refetch: refetchOpp,
    fetchNextPage: fetchNextOpp,
    hasNextPage: hasMoreOpp,
    isFetchingNextPage: isFetchingMoreOpp,
  } = useInfiniteOpportunities(PAGE_SIZE)
  const opportunities = useMemo(() => oppPages?.pages.flatMap(p => p.items) ?? [], [oppPages])
  const totalCount = oppPages?.pages[0]?.totalCount ?? 0

  const {
    data: profilePages,
    isLoading: profilesLoading,
    isError: profilesError,
    refetch: refetchProfiles,
    fetchNextPage: fetchNextProfiles,
    hasNextPage: hasMoreProfiles,
    isFetchingNextPage: isFetchingMoreProfiles,
  } = useInfinitePublicProfiles(PEOPLE_PAGE_SIZE)
  const publicProfiles = useMemo(() => profilePages?.pages.flatMap(p => p.items) ?? [], [profilePages])
  const { data: allRecs = [], isLoading: recsLoading } = useUserRecommendations({ limit: 15 })
  const sidebarRecs = allRecs.slice(0, 4)

  // AI recommended projects — used for match labels in all sort modes
  const { data: aiProjects = [] } = useQuery({
    queryKey: ['ai_project_recommendations'],
    queryFn: async () => {
      const res = await fetch('/api/opportunities/recommend')
      if (!res.ok) return []
      return res.json() as Promise<Array<OpportunityWithCreator & { match_score: number; match_reason: string }>>
    },
    staleTime: 1000 * 60 * 5,
    enabled: !isAuthLoading && !!user,
  })
  const aiScoreMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of aiProjects) map.set(p.id, p.match_score)
    return map
  }, [aiProjects])

  const query = searchQuery.toLowerCase().trim()

  // ── Derived: project cards ──
  const projectCards = useMemo(() => {
    // Shared filter — applies to ALL sort modes including AI
    const filterOpp = (opp: OpportunityWithCreator) => {
      const normalizedType = opp.type === 'team_building' ? 'startup' : (opp.type || 'side_project')
      if (typeFilter !== 'all' && normalizedType !== typeFilter) return false
      // Role filter — slug 정확 매칭
      if (projectRoleFilter !== 'all') {
        const roles = opp.needed_roles || []
        if (!roles.includes(projectRoleFilter)) return false
      }
      if (recruitingOnly && opp.status !== 'active') return false
      // Category filter — slug 정확 매칭
      if (selectedCategory !== 'all') {
        const tags = opp.interest_tags || []
        if (!tags.includes(selectedCategory)) return false
      }
      if (query) {
        if (searchScope === 'people') return false
        const title = (opp.title || '').toLowerCase()
        const desc = (opp.description || '').toLowerCase()
        const tags = (opp.interest_tags || []).join(' ').toLowerCase()
        const roles = (opp.needed_roles || []).join(' ').toLowerCase()
        if (searchScope === 'skills') {
          if (!tags.includes(query) && !roles.includes(query)) return false
        } else {
          if (!title.includes(query) && !desc.includes(query) && !tags.includes(query) && !roles.includes(query)) return false
        }
      }
      return true
    }

    const toCard = (opp: OpportunityWithCreator) => {
      const aiScore = aiScoreMap.get(opp.id)
      const matchLabel = aiScore != null && aiScore >= 80 ? '잘 맞는 프로젝트'
        : aiScore != null && aiScore >= 60 ? '관심 가능'
        : null
      return {
        id: opp.id,
        title: opp.title,
        desc: opp.description || '',
        roles: opp.needed_roles || [],
        tags: (opp.interest_tags || []).slice(0, 3),
        coverImage: (opp.demo_images && opp.demo_images.length > 0) ? opp.demo_images[0] : null,
        daysLeft: calculateDaysLeft(opp.created_at),
        updatedAt: opp.updated_at ?? undefined,
        status: opp.status,
        matchLabel,
        badges: (opp as unknown as { badges?: string[] | null }).badges ?? null,
        viewsCount: opp.views_count || 0,
        interestCount: opp.interest_count || 0,
      }
    }

    // Popularity score helper
    const popScore = (opp: OpportunityWithCreator) =>
      (opp.views_count || 0) + (opp.applications_count || 0) * 5 + (opp.interest_count || 0) * 3

    // tie 발생 시 id로 안정화 — 동일 점수/시간에서 순서가 흔들리는 것 방지
    const tieBreak = (a: OpportunityWithCreator, b: OpportunityWithCreator) => a.id.localeCompare(b.id)

    return opportunities
      .filter(filterOpp)
      .sort((a, b) => {
        if (sortBy === 'latest') {
          const diff = new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          return diff !== 0 ? diff : tieBreak(a, b)
        }

        if (sortBy === 'popular') {
          const diff = popScore(b) - popScore(a)
          return diff !== 0 ? diff : tieBreak(a, b)
        }

        // trending: popularity weighted by recency (HN-style decay)
        const now = Date.now()
        const trendScore = (opp: OpportunityWithCreator) => {
          const ageDays = (now - new Date(opp.created_at || 0).getTime()) / (1000 * 60 * 60 * 24)
          return (popScore(opp) + 1) / Math.pow(ageDays + 2, 1.5)
        }
        const diff = trendScore(b) - trendScore(a)
        return diff !== 0 ? diff : tieBreak(a, b)
      })
      .map((opp: OpportunityWithCreator) => toCard(opp))
  },
    [opportunities, typeFilter, projectRoleFilter, recruitingOnly, selectedCategory, query, searchScope, sortBy, aiScoreMap]
  )

  // ── Derived: talent cards ──
  const recsMap = useMemo(() => new Map(allRecs.map(r => [r.user_id, r])), [allRecs])
  const selectedMatchData = useMemo(() => {
    if (!selectedProfileId) return null
    const userId = profileByUserId ? selectedProfileId : publicProfiles.find(p => p.id === selectedProfileId)?.user_id
    return userId ? recsMap.get(userId) ?? null : null
  }, [selectedProfileId, profileByUserId, publicProfiles, recsMap])
  const talentCards = useMemo(() => publicProfiles
    .filter((profile: PublicProfile) => {
      // Role filter — positionSlugs로 매칭
      if (peopleRoleFilter !== 'all') {
        const position = profile.desired_position || ''
        const filterDef = PEOPLE_ROLE_FILTERS.find(f => f.id === peopleRoleFilter)
        if (filterDef && 'positionSlugs' in filterDef) {
          if (!(filterDef as { positionSlugs: string[] }).positionSlugs.includes(position)) return false
        }
      }
      if (!query) return true
      if (searchScope === 'projects') return false
      const name = (profile.nickname || '').toLowerCase()
      const role = (profile.desired_position || '').toLowerCase()
      const tags = (profile.interest_tags || []).join(' ').toLowerCase()
      if (searchScope === 'skills') return tags.includes(query)
      return name.includes(query) || role.includes(query) || tags.includes(query)
    })
    .map((profile: PublicProfile) => {
      const rec = recsMap.get(profile.user_id)
      // vision_summary is stored as JSON string — extract the human-readable summary
      let visionText: string | null = null
      if (profile.vision_summary) {
        try {
          const parsed = JSON.parse(profile.vision_summary)
          visionText = parsed.summary || null
        } catch {
          // If it's already a plain string, use as-is
          visionText = profile.vision_summary
        }
      }
      return {
        id: profile.id,
        name: cleanNickname(profile.nickname || 'Anonymous'),
        role: positionLabel(profile.desired_position || '') || 'Explorer',
        tags: (profile.interest_tags || []).slice(0, 3),
        status: 'OPEN' as const,
        visionSummary: visionText,
        location: profile.location,
        avatarUrl: profile.avatar_url,
        matchScore: rec?.match_score ?? null,
        matchReason: rec?.match_reason ?? null,
        badges: profile.badges ?? null,
        interestCount: profile.interest_count || 0,
        createdAt: profile.created_at,
        university: profile.university ?? null,
        affiliationType: profile.affiliation_type ?? null,
      }
    })
    .filter((card) => {
      if (peopleSortBy === 'ai') return card.matchScore != null && card.matchScore > 0
      return true
    })
    .sort((a, b) => {
      // tie 발생 시 id로 안정화
      const tieBreak = a.id.localeCompare(b.id)
      if (peopleSortBy === 'ai') {
        const diff = (b.matchScore ?? 0) - (a.matchScore ?? 0)
        return diff !== 0 ? diff : tieBreak
      }
      if (peopleSortBy === 'popular') {
        const diff = (b.interestCount || 0) - (a.interestCount || 0)
        return diff !== 0 ? diff : tieBreak
      }
      // 'latest': sort by created_at (newest first)
      const diff = new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      return diff !== 0 ? diff : tieBreak
    }),
    [publicProfiles, peopleRoleFilter, query, searchScope, recsMap, peopleSortBy]
  )

  // ── Derived: project categories ──
  const projectCategories = useMemo(() => FALLBACK_CATEGORIES.map((cat) => {
    const count = cat.id === 'all'
      ? opportunities.length
      : opportunities.filter((opp) =>
          (opp.interest_tags || []).some(t => t.toLowerCase().includes(cat.id.toLowerCase()))
        ).length
    return { ...cat, count, icon: CATEGORY_ICONS[cat.id] || LayoutGrid }
  }), [opportunities])

  // ── Derived: people categories ──
  const peopleCategories = useMemo(() =>
    PEOPLE_ROLE_FILTERS.map((f) => {
      const count = f.id === 'all'
        ? publicProfiles.length
        : publicProfiles.filter(p => {
            const position = p.desired_position || ''
            return 'positionSlugs' in f && (f as { positionSlugs: string[] }).positionSlugs.includes(position)
          }).length
      return { id: f.id, label: f.label, count, icon: PEOPLE_CATEGORY_ICONS[f.id] || Users }
    }),
    [publicProfiles]
  )

  // ── Derived: people trending tags ──
  const peopleTrendingTags = useMemo(() => {
    const tagCounts: Record<string, number> = {}
    publicProfiles.forEach(p => {
      (p.interest_tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }))
  }, [publicProfiles])

  // ── Derived: active filter chips ──
  const activeFilterChips = useMemo<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = []
    if (activeTab === 'projects') {
      if (typeFilter !== 'all') {
        const tf = TYPE_FILTERS.find(t => t.id === typeFilter)
        chips.push({ key: `type:${typeFilter}`, label: tf?.label ?? typeFilter, onRemove: () => setTypeFilter('all') })
      }
      if (projectRoleFilter !== 'all') {
        const rf = PROJECT_ROLE_FILTERS.find(r => r.id === projectRoleFilter)
        chips.push({ key: `role:${projectRoleFilter}`, label: rf?.label ?? projectRoleFilter, onRemove: () => setProjectRoleFilter('all') })
      }
      if (selectedCategory !== 'all') {
        const cat = projectCategories.find(c => c.id === selectedCategory)
        chips.push({ key: `cat:${selectedCategory}`, label: cat?.label ?? selectedCategory, onRemove: () => setSelectedCategory('all') })
      }
      if (recruitingOnly) {
        chips.push({ key: 'recruiting', label: '모집 중만', onRemove: () => setRecruitingOnly(false) })
      }
    } else {
      if (peopleRoleFilter !== 'all') {
        const rf = PEOPLE_ROLE_FILTERS.find(r => r.id === peopleRoleFilter)
        chips.push({ key: `prole:${peopleRoleFilter}`, label: rf?.label ?? peopleRoleFilter, onRemove: () => setPeopleRoleFilter('all') })
      }
    }
    return chips
  }, [activeTab, typeFilter, projectRoleFilter, selectedCategory, recruitingOnly, peopleRoleFilter, projectCategories])

  const handleResetFilters = useCallback(() => {
    setTypeFilter('all')
    setProjectRoleFilter('all')
    setSelectedCategory('all')
    setRecruitingOnly(false)
    setPeopleRoleFilter('all')
  }, [])

  const { data: liveTrending } = useQuery({
    queryKey: ['explore', 'trending'],
    queryFn: async () => {
      const res = await fetch('/api/explore/trending')
      if (!res.ok) return null
      const data = await res.json()
      return data.tags as { tag: string; count: number }[]
    },
    staleTime: 5 * 60_000,
  })
  const projectTrendingTags = liveTrending && liveTrending.length > 0 ? liveTrending : FALLBACK_TRENDING_TAGS

  // ── Prop groups ──
  const filterProps = activeTab === 'projects' ? {
    activeTab,
    categories: projectCategories,
    selectedCategory,
    onCategoryChange: setSelectedCategory,
    trendingTags: projectTrendingTags,
    onTagClick: (tag: string) => { setSearchInput(tag); setSearchScope('skills'); setActiveTab('projects') },
  } as const : {
    activeTab,
    categories: peopleCategories,
    selectedCategory: peopleRoleFilter,
    onCategoryChange: (id: string) => setPeopleRoleFilter(id as PeopleRoleFilter),
    trendingTags: peopleTrendingTags,
    onTagClick: (tag: string) => { setSearchInput(tag); setSearchScope('skills'); setActiveTab('people') },
  } as const

  const searchProps = {
    searchInput,
    onSearchInputChange: setSearchInput,
    searchScope,
    onSearchScopeChange: setSearchScope,
    onScopeSelectTab: setActiveTab,
  } as const

  const tabProps = {
    activeTab,
    onTabChange: setActiveTab,
    sortBy,
    onSortChange: setSortBy,
    peopleSortBy,
    onPeopleSortChange: setPeopleSortBy,
    query,
    projectCount: projectCards.length,
    peopleCount: talentCards.length,
    activeFilterCount: activeFilterChips.length,
    onFilterButtonClick: () => setIsFilterSheetOpen(true),
  } as const

  const handlePrefetchProject = useCallback((id: string) => {
    queryClient.prefetchQuery({
      queryKey: opportunityKeys.detail(id),
      queryFn: async () => {
        const { data, error } = await supabase.from('opportunities').select(OPP_WITH_CREATOR_SELECT).eq('id', id).single()
        if (error) throw error
        return data
      },
      staleTime: 1000 * 60 * 2,
    })
  }, [queryClient])

  const handleSelectProject = useCallback((id: string) => {
    guide.markExploreVisited()
    handlePrefetchProject(id)
    replaceParams({ project: id, profile: null, profileBy: null })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guide.markExploreVisited, handlePrefetchProject, replaceParams])

  const handleSelectProfile = useCallback((id: string, byUserId: boolean) => {
    replaceParams({ project: null, profile: id, profileBy: byUserId ? 'userId' : null })
  }, [replaceParams])

  return (
    <div className="bg-surface-bg min-h-full">
      <DashboardLayout
        size="wide"
        className="pt-0 md:pt-6"
        sidebar={
          <ExploreSidebar
            {...filterProps}
            talentCards={talentCards}
            sidebarRecs={sidebarRecs}
            recsLoading={recsLoading}
            onSelectPeople={() => setActiveTab('people')}
            onSelectProfile={handleSelectProfile}
          />
        }
      >
        {/* 배너: DashboardLayout 안에서 높이 예산 내 렌더링 */}
        {guide.visible && (
          <StarterGuideCard
            steps={guide.steps}
            completedCount={guide.completedCount}
            total={guide.total}
            showLinkHint={guide.showLinkHint}
            onSoftDismiss={guide.softDismiss}
            onPermanentDismiss={guide.permanentDismiss}
          />
        )}
        {!guide.visible && <ProfileCompletionBanner />}
        {isAuthenticated && profile && !profile.ai_chat_completed && (
          <AiMatchingNudgeCard />
        )}

        {/* 검색바 + 필터: 데스크톱만 */}
        <div className="hidden md:flex items-start gap-2">
          <div className="flex-1">
            <ExploreSearchBar {...searchProps} />
          </div>
          <button
            onClick={() => setIsFilterSheetOpen(true)}
            className="shrink-0 mt-0.5 flex items-center gap-1.5 px-4 py-3 text-xs font-bold border rounded-xl transition-all bg-surface-card text-txt-secondary border-border hover:border-border hover:shadow-sm"
          >
            <Filter size={14} />
            필터
            {activeFilterChips.length > 0 && (
              <span className="ml-0.5 min-w-[16px] h-4 flex items-center justify-center text-[10px] font-bold bg-brand text-white rounded-full px-1">
                {activeFilterChips.length}
              </span>
            )}
          </button>
        </div>

        <ExploreTabBar
          {...tabProps}
          mobileSearchOpen={mobileSearchOpen}
          onMobileSearchToggle={() => setMobileSearchOpen(prev => !prev)}
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
        />

        <ActiveFilterChips chips={activeFilterChips} onClearAll={handleResetFilters} />


        {activeTab === 'projects' && (
          <ExploreProjectGrid
            projectCards={projectCards}
            isLoading={opportunitiesLoading}
            isError={oppError}
            onRetry={() => refetchOpp()}
            hasMore={hasMoreOpp ?? false}
            isFetchingMore={isFetchingMoreOpp}
            totalCount={totalCount}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            recruitingOnly={recruitingOnly}
            onLoadMore={() => fetchNextOpp()}
            onSelectProject={handleSelectProject}
            onPrefetchProject={handlePrefetchProject}
            sortBy={sortBy}
          />
        )}

        {activeTab === 'people' && (
          <ExplorePeopleGrid
            talentCards={talentCards}
            isLoading={profilesLoading}
            isError={profilesError}
            onRetry={() => refetchProfiles()}
            hasMore={hasMoreProfiles ?? false}
            isFetchingMore={isFetchingMoreProfiles}
            onLoadMore={() => fetchNextProfiles()}
            onSelectProfile={handleSelectProfile}
            peopleSortBy={peopleSortBy}
          />
        )}
      </DashboardLayout>

      <FilterSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        activeTab={activeTab}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        projectRoleFilter={projectRoleFilter}
        onProjectRoleFilterChange={setProjectRoleFilter}
        categories={projectCategories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        recruitingOnly={recruitingOnly}
        onRecruitingOnlyChange={setRecruitingOnly}
        peopleRoleFilter={peopleRoleFilter}
        onPeopleRoleFilterChange={setPeopleRoleFilter}
        onReset={handleResetFilters}
      />


      <AnimatePresence>
        {selectedProjectId && (
          <ProjectDetailModal
            key="project-modal"
            projectId={selectedProjectId}
            onClose={() => replaceParams({ project: null })}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedProfileId && (
          <ProfileDetailModal
            key="profile-modal"
            profileId={selectedProfileId}
            byUserId={profileByUserId}
            matchData={selectedMatchData}
            onClose={() => { replaceParams({ profile: null, profileBy: null }); setInitialCoffeeChatOpen(false); setInitialCoffeeChatMessage(undefined) }}
            onSelectProject={(projectId) => {
              handlePrefetchProject(projectId)
              replaceParams({ profile: null, profileBy: null, project: projectId })
            }}
            initialCoffeeChatOpen={initialCoffeeChatOpen}
            initialCoffeeChatMessage={initialCoffeeChatMessage}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
