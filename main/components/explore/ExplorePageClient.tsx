'use client'

import React, { useState, useEffect, useMemo, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { LayoutGrid, Users } from 'lucide-react'
import { useSearchParams as useNextSearchParams, useRouter, usePathname } from 'next/navigation'
import { DashboardLayout } from '@/components/ui/DashboardLayout'

const ModalLoadingFallback = () => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-modal-backdrop">
    <div className="bg-surface-card border border-border-strong px-6 py-4 shadow-brutal">
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
import { useOpportunities, type OpportunityWithCreator, calculateDaysLeft } from '@/src/hooks/useOpportunities'
import { usePublicProfiles, type PublicProfile } from '@/src/hooks/usePublicProfiles'
import { useUserRecommendations, type UserRecommendation } from '@/src/hooks/useUserRecommendations'
import { FALLBACK_CATEGORIES, FALLBACK_TRENDING_TAGS } from '@/src/lib/fallbacks/explore'
import { PEOPLE_ROLE_FILTERS, PEOPLE_CATEGORY_ICONS } from '@/components/explore/constants'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/src/context/AuthContext'
import { CATEGORY_ICONS, PAGE_SIZE, PEOPLE_PAGE_SIZE } from '@/components/explore/constants'
import {
  ExploreHeroCarousel,
  ExploreSearchBar,
  ExploreSidebar,
  ExploreAsidePanel,
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
    <Suspense fallback={null}>
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

  // ── State ──
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [profileByUserId, setProfileByUserId] = useState(false)
  const [selectedMatchData, setSelectedMatchData] = useState<UserRecommendation | null>(null)
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
  const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE)
  const [peopleDisplayLimit, setPeopleDisplayLimit] = useState(PEOPLE_PAGE_SIZE)

  const searchQuery = useDebouncedValue(searchInput, 300)
  const { isAuthenticated, user } = useAuth()

  // Sync search to URL
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (searchScope !== 'all') params.set('scope', searchScope)
    const qs = params.toString()
    const newPath = `${pathname}${qs ? `?${qs}` : ''}`
    const currentPath = `${pathname}${window.location.search}`
    if (newPath !== currentPath) {
      router.replace(newPath, { scroll: false })
    }
  }, [searchQuery, searchScope, pathname, router])

  // ── Data ──
  const { data: oppData, isLoading: opportunitiesLoading, isError: oppError, refetch: refetchOpp } = useOpportunities({ limit: displayLimit })
  const opportunities = oppData?.items ?? []
  const totalCount = oppData?.totalCount ?? 0
  const hasMore = displayLimit < totalCount

  const { data: publicProfiles = [], isLoading: profilesLoading, isError: profilesError, refetch: refetchProfiles } = usePublicProfiles({ limit: peopleDisplayLimit })
  const { data: allRecs = [] } = useUserRecommendations({ limit: 15 })
  const sidebarRecs = allRecs.slice(0, 4)

  // AI recommended projects
  const { data: aiProjects = [] } = useQuery({
    queryKey: ['ai_project_recommendations'],
    queryFn: async () => {
      const res = await fetch('/api/opportunities/recommend')
      if (!res.ok) return []
      return res.json() as Promise<Array<OpportunityWithCreator & { match_score: number; match_reason: string }>>
    },
    staleTime: 1000 * 60 * 5,
    enabled: sortBy === 'ai' && !!user,
  })

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

    const toCard = (opp: OpportunityWithCreator, matchLabel: string | null = null) => ({
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
    })

    // AI sort: pre-ranked data, but still apply filters
    if (sortBy === 'ai' && aiProjects.length > 0) {
      return aiProjects
        .filter(filterOpp)
        .map((opp) => toCard(
          opp,
          opp.match_score >= 80 ? '잘 맞는 프로젝트' : opp.match_score >= 60 ? '관심 가능' : null,
        ))
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
    [opportunities, typeFilter, recruitingOnly, selectedCategory, query, searchScope, sortBy, aiProjects]
  )

  // ── Derived: talent cards ──
  const recsMap = useMemo(() => new Map(allRecs.map(r => [r.user_id, r])), [allRecs])
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
        name: profile.nickname || 'Anonymous',
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
      }
    })
    .sort((a, b) => {
      if (peopleSortBy === 'ai') {
        const aScore = a.matchScore ?? -1
        const bScore = b.matchScore ?? -1
        return bScore - aScore
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

  const handleSelectProfile = (id: string, byUserId: boolean) => {
    setSelectedProfileId(id)
    setProfileByUserId(byUserId)
    const userId = byUserId ? id : publicProfiles.find(p => p.id === id)?.user_id
    setSelectedMatchData(userId ? recsMap.get(userId) ?? null : null)
  }

  return (
    <div className="bg-surface-bg min-h-full">
      <ExploreHeroCarousel />

      <DashboardLayout
        size="wide"
        sidebar={<ExploreSidebar {...filterProps} />}
        aside={
          <ExploreAsidePanel
            talentCards={talentCards}
            sidebarRecs={sidebarRecs}
            totalProjectCount={totalCount}
            projectCardCount={projectCards.length}
            categoriesCount={filterProps.categories.length}
            onSelectPeople={() => setActiveTab('people')}
            onSelectProfile={handleSelectProfile}
          />
        }
      >
        <ExploreSearchBar {...searchProps} />
        <ExploreMobileFilter
          isOpen={isMobileFilterOpen}
          onToggle={() => setIsMobileFilterOpen(prev => !prev)}
          {...filterProps}
        />
        <ExploreTabBar {...tabProps} />

        {activeTab === 'projects' && (
          <ExploreProjectGrid
            projectCards={projectCards}
            isLoading={opportunitiesLoading}
            isError={oppError}
            onRetry={() => refetchOpp()}
            hasMore={hasMore}
            totalCount={totalCount}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            recruitingOnly={recruitingOnly}
            onLoadMore={() => setDisplayLimit(prev => prev + PAGE_SIZE)}
            onSelectProject={setSelectedProjectId}
          />
        )}

        {activeTab === 'people' && (
          <ExplorePeopleGrid
            talentCards={talentCards}
            isLoading={profilesLoading}
            isError={profilesError}
            onRetry={() => refetchProfiles()}
            hasMore={publicProfiles.length >= peopleDisplayLimit}
            onLoadMore={() => setPeopleDisplayLimit(prev => prev + PEOPLE_PAGE_SIZE)}
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
          profileId={selectedProfileId}
          byUserId={profileByUserId}
          matchData={selectedMatchData}
          onClose={() => { setSelectedProfileId(null); setSelectedMatchData(null) }}
          onSelectProject={(projectId) => {
            setSelectedProfileId(null)
            setSelectedMatchData(null)
            setSelectedProjectId(projectId)
          }}
        />
      )}
    </div>
  )
}
