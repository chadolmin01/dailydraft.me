'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { LayoutGrid, Users, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useSearchParams as useNextSearchParams, useRouter, usePathname } from 'next/navigation'
import { DashboardLayout } from '@/components/ui/DashboardLayout'
import { SkeletonGrid, SkeletonSidebar } from '@/components/ui/Skeleton'
import { ProfileCompletionBanner } from '@/components/ui/ProfileCompletionBanner'
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
const ProfileDetailModal = dynamic(
  () => import('@/components/ProfileDetailModal').then(m => ({ default: m.ProfileDetailModal })),
  { ssr: false, loading: ModalLoadingFallback }
)
import { useInfiniteOpportunities, type OpportunityWithCreator, calculateDaysLeft } from '@/src/hooks/useOpportunities'
import { cleanNickname } from '@/src/lib/clean-nickname'
import { useInfinitePublicProfiles, type PublicProfile } from '@/src/hooks/usePublicProfiles'
import { useUserRecommendations, type UserRecommendation } from '@/src/hooks/useUserRecommendations'
import { FALLBACK_CATEGORIES, FALLBACK_TRENDING_TAGS } from '@/src/lib/fallbacks/explore'
import { PEOPLE_ROLE_FILTERS, PEOPLE_CATEGORY_ICONS } from '@/components/explore/constants'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/src/context/AuthContext'
import { CATEGORY_ICONS, PAGE_SIZE, PEOPLE_PAGE_SIZE } from './constants'
import {
  ExploreHeroCarousel,
  ExploreSearchBar,
  ExploreSidebar,
  ExploreTabBar,
  ExploreMobileFilter,
  ExploreProjectGrid,
  ExplorePeopleGrid,
} from '@/components/explore'
import type { ActiveTab, SortBy, TypeFilter, SearchScope, PeopleRoleFilter, PeopleSortBy } from '@/components/explore/types'

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
  const urlParams = useNextSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const initialQuery = urlParams.get('q') || ''
  const initialScope = urlParams.get('scope') as SearchScope || 'all'

  // ── Modal state (local state + URL sync via window.history) ──
  // Initialize as null to avoid SSR/hydration mismatch, then sync from URL in useEffect
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [profileByUserId, setProfileByUserId] = useState(false)
  const [initialCoffeeChatOpen, setInitialCoffeeChatOpen] = useState(false)
  const [initialCoffeeChatMessage, setInitialCoffeeChatMessage] = useState<string | undefined>(undefined)
  const hydratedRef = React.useRef(false)

  // Hydrate modal state from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const project = params.get('project')
    const profile = params.get('profile')
    const byUserId = params.get('profileBy') === 'userId'
    const coffeeChat = params.get('coffeeChat')
    const msg = params.get('msg')
    if (project) setSelectedProjectId(project)
    if (profile) setSelectedProfileId(profile)
    if (byUserId) setProfileByUserId(byUserId)
    if (coffeeChat) {
      setSelectedProfileId(coffeeChat)
      setProfileByUserId(true)
      setInitialCoffeeChatOpen(true)
      if (msg) setInitialCoffeeChatMessage(decodeURIComponent(msg))
      // URL에서 coffeeChat/msg 파라미터 제거
      params.delete('coffeeChat')
      params.delete('msg')
      const qs = params.toString()
      window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`)
    }
    hydratedRef.current = true
  }, [])

  // Sync modal state → URL (without Next.js navigation) — only after hydration
  useEffect(() => {
    if (!hydratedRef.current) return
    const params = new URLSearchParams(window.location.search)
    if (selectedProjectId) params.set('project', selectedProjectId)
    else params.delete('project')
    if (selectedProfileId) params.set('profile', selectedProfileId)
    else params.delete('profile')
    if (profileByUserId && selectedProfileId) params.set('profileBy', 'userId')
    else params.delete('profileBy')
    const qs = params.toString()
    const newUrl = `${window.location.pathname}${qs ? `?${qs}` : ''}`
    if (newUrl !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, '', newUrl)
    }
  }, [selectedProjectId, selectedProfileId, profileByUserId])

  // Handle browser back/forward
  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search)
      setSelectedProjectId(params.get('project'))
      setSelectedProfileId(params.get('profile'))
      setProfileByUserId(params.get('profileBy') === 'userId')
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // ── State ──
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState<SortBy>('trending')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [activeTab, setActiveTab] = useState<ActiveTab>('projects')
  const [recruitingOnly, setRecruitingOnly] = useState(false)
  const [peopleRoleFilter, setPeopleRoleFilter] = useState<PeopleRoleFilter>('all')
  const [peopleSortBy, setPeopleSortBy] = useState<PeopleSortBy>('latest')
  const [searchInput, setSearchInput] = useState(initialQuery)
  const [searchScope, setSearchScope] = useState<SearchScope>(initialScope)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  const searchQuery = useDebouncedValue(searchInput, 300)
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth()
  const guide = useStarterGuide()

  // Starter guide: completion toast
  useEffect(() => {
    if (guide.justCompleted) {
      toast.success('시작 가이드를 모두 완료했어요! 🎉')
    }
  }, [guide.justCompleted])

  // Sync search to URL (preserves modal params)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (searchQuery) params.set('q', searchQuery)
    else params.delete('q')
    if (searchScope !== 'all') params.set('scope', searchScope)
    else params.delete('scope')
    const qs = params.toString()
    const newPath = `${pathname}${qs ? `?${qs}` : ''}`
    const currentPath = `${pathname}${window.location.search}`
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
      if (recruitingOnly && opp.status !== 'active') return false
      if (selectedCategory !== 'all') {
        const tags = (opp.interest_tags || []).map(t => t.toLowerCase())
        if (!tags.some(t => t.includes(selectedCategory.toLowerCase()))) return false
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

    return opportunities
      .filter(filterOpp)
      .sort((a, b) => {
        if (sortBy === 'latest')
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()

        if (sortBy === 'popular')
          return popScore(b) - popScore(a)

        // trending: popularity weighted by recency (HN-style decay)
        const now = Date.now()
        const trendScore = (opp: OpportunityWithCreator) => {
          const ageDays = (now - new Date(opp.created_at || 0).getTime()) / (1000 * 60 * 60 * 24)
          return (popScore(opp) + 1) / Math.pow(ageDays + 2, 1.5)
        }
        return trendScore(b) - trendScore(a)
      })
      .map((opp: OpportunityWithCreator) => toCard(opp))
  },
    [opportunities, typeFilter, recruitingOnly, selectedCategory, query, searchScope, sortBy, aiScoreMap]
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
      // Role filter
      if (peopleRoleFilter !== 'all') {
        const role = (profile.desired_position || '').toLowerCase()
        const filterDef = PEOPLE_ROLE_FILTERS.find(f => f.id === peopleRoleFilter)
        if (filterDef && 'keywords' in filterDef) {
          const keywords = filterDef.keywords
          if (!keywords.some(kw => role.includes(kw))) return false
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
        role: profile.desired_position || 'Explorer',
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
      if (peopleSortBy === 'ai') {
        return (b.matchScore ?? 0) - (a.matchScore ?? 0)
      }
      if (peopleSortBy === 'popular')
        return (b.interestCount || 0) - (a.interestCount || 0)
      // 'latest': sort by created_at (newest first)
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
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
            const role = (p.desired_position || '').toLowerCase()
            return 'keywords' in f && f.keywords.some(kw => role.includes(kw))
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
    recruitingOnly,
    onRecruitingOnlyChange: setRecruitingOnly,
  } as const : {
    activeTab,
    categories: peopleCategories,
    selectedCategory: peopleRoleFilter,
    onCategoryChange: (id: string) => setPeopleRoleFilter(id as PeopleRoleFilter),
    trendingTags: peopleTrendingTags,
    onTagClick: (tag: string) => { setSearchInput(tag); setSearchScope('skills'); setActiveTab('people') },
    recruitingOnly: false,
    onRecruitingOnlyChange: () => {},
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
    typeFilter,
    onTypeFilterChange: setTypeFilter,
    peopleRoleFilter,
    onPeopleRoleFilterChange: setPeopleRoleFilter,
    peopleSortBy,
    onPeopleSortChange: setPeopleSortBy,
    query,
    projectCount: projectCards.length,
    peopleCount: talentCards.length,
  } as const

  // Starter guide: 10s dwell → mark explore visited
  useEffect(() => {
    if (!guide.visible) return
    const timer = setTimeout(() => guide.markExploreVisited(), 10_000)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guide.visible])

  const handleSelectProject = useCallback((id: string) => {
    guide.markExploreVisited()
    setSelectedProfileId(null)
    setProfileByUserId(false)
    setSelectedProjectId(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guide.markExploreVisited])

  const handleSelectProfile = useCallback((id: string, byUserId: boolean) => {
    setSelectedProjectId(null)
    setSelectedProfileId(id)
    setProfileByUserId(byUserId)
  }, [])

  return (
    <div className="bg-surface-bg min-h-full">
      <div className="relative">
        <ExploreHeroCarousel />
        {guide.visible && (
          <div className="absolute inset-0 z-10 flex items-end sm:items-center justify-center pb-6 sm:pb-0 animate-[fadeIn_0.3s_ease-out]">
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent sm:bg-black/20 sm:backdrop-blur-[2px]" />
            <div className="relative w-full max-w-md mx-4 animate-[slideUp_0.4s_cubic-bezier(0.16,1,0.3,1)]">
              <StarterGuideCard
                steps={guide.steps}
                completedCount={guide.completedCount}
                total={guide.total}
                showLinkHint={guide.showLinkHint}
                onSoftDismiss={guide.softDismiss}
                onPermanentDismiss={guide.permanentDismiss}
              />
            </div>
          </div>
        )}
      </div>

      <div className="max-w-screen-xl mx-auto px-4 mt-1">
        {!guide.visible && <ProfileCompletionBanner />}
      </div>

      <DashboardLayout
        size="wide"
        className="pt-6"
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
        {/* 검색바: 모바일 숨김, 데스크톱만 */}
        <div className="hidden md:block">
          <ExploreSearchBar {...searchProps} />
        </div>

        <ExploreTabBar
          {...tabProps}
          mobileSearchOpen={mobileSearchOpen}
          onMobileSearchToggle={() => setMobileSearchOpen(prev => !prev)}
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          isMobileFilterOpen={isMobileFilterOpen}
          onMobileFilterToggle={() => setIsMobileFilterOpen(prev => !prev)}
        />

        <ExploreMobileFilter
          isOpen={isMobileFilterOpen}
          onToggle={() => setIsMobileFilterOpen(false)}
          {...filterProps}
        />

        {!isAuthenticated && ((activeTab === 'projects' && sortBy === 'ai') || (activeTab === 'people' && peopleSortBy === 'ai')) && (
          <div className="flex items-center gap-3 px-4 py-3 mb-4 border border-brand-border bg-brand-bg">
            <Sparkles size={16} className="text-brand shrink-0" />
            <p className="text-xs text-txt-secondary flex-1">로그인하면 내 관심사에 맞는 AI 추천을 받을 수 있어요</p>
            <Link href="/login" className="shrink-0 px-3 py-1.5 bg-surface-inverse text-txt-inverse rounded-xl text-xs font-bold border border-surface-inverse hover:bg-surface-inverse transition-colors">
              로그인
            </Link>
          </div>
        )}

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

      {selectedProjectId && (
        <ProjectDetailModal
          projectId={selectedProjectId}
          onClose={() => setSelectedProjectId(null)}
        />
      )}

      {selectedProfileId && (
        <ProfileDetailModal
          key={selectedProfileId}
          profileId={selectedProfileId}
          byUserId={profileByUserId}
          matchData={selectedMatchData}
          onClose={() => { setSelectedProfileId(null); setProfileByUserId(false); setInitialCoffeeChatOpen(false); setInitialCoffeeChatMessage(undefined) }}
          onSelectProject={(projectId) => {
            setSelectedProfileId(null)
            setProfileByUserId(false)
            setSelectedProjectId(projectId)
          }}
          initialCoffeeChatOpen={initialCoffeeChatOpen}
          initialCoffeeChatMessage={initialCoffeeChatMessage}
        />
      )}
    </div>
  )
}
