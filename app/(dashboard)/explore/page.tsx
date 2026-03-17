'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { LayoutGrid } from 'lucide-react'
import { useSearchParams as useNextSearchParams, useRouter, usePathname } from 'next/navigation'
import { DashboardLayout } from '@/components/ui/DashboardLayout'
import { ProjectDetailModal } from '@/components/ProjectDetailModal'
import { ProfileDetailModal } from '@/components/ProfileDetailModal'
import { useOpportunities, type OpportunityWithCreator, calculateDaysLeft } from '@/src/hooks/useOpportunities'
import { usePublicProfiles, type PublicProfile } from '@/src/hooks/usePublicProfiles'
import { useUserRecommendations } from '@/src/hooks/useUserRecommendations'
import { FALLBACK_CATEGORIES, FALLBACK_TRENDING_TAGS } from '@/src/lib/fallbacks/explore'
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
import type { ActiveTab, SortBy, TypeFilter, SearchScope } from '@/components/explore/types'

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export default function ExplorePage() {
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
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState<SortBy>('trending')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [activeTab, setActiveTab] = useState<ActiveTab>('projects')
  const [recruitingOnly, setRecruitingOnly] = useState(false)
  const [searchInput, setSearchInput] = useState(initialQuery)
  const [searchScope, setSearchScope] = useState<SearchScope>(initialScope)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE)
  const [peopleDisplayLimit, setPeopleDisplayLimit] = useState(PEOPLE_PAGE_SIZE)

  const searchQuery = useDebouncedValue(searchInput, 300)
  const { isAuthenticated } = useAuth()

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
  const { data: allRecs = [] } = useUserRecommendations({ limit: 6 })
  const sidebarRecs = allRecs.slice(0, 4)
  const peopleRecs = allRecs

  const query = searchQuery.toLowerCase().trim()

  // ── Derived: project cards ──
  const projectCards = opportunities
    .filter((opp: OpportunityWithCreator) => {
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

  // ── Derived: talent cards ──
  const talentCards = publicProfiles
    .filter((profile: PublicProfile) => {
      if (!query) return true
      if (searchScope === 'projects') return false
      const name = (profile.nickname || '').toLowerCase()
      const role = (profile.desired_position || '').toLowerCase()
      const tags = (profile.interest_tags || []).join(' ').toLowerCase()
      if (searchScope === 'skills') return tags.includes(query)
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
      avatarUrl: profile.avatar_url,
    }))

  // ── Derived: categories ──
  const categories = FALLBACK_CATEGORIES.map((cat) => {
    const count = cat.id === 'all'
      ? opportunities.length
      : opportunities.filter((opp) =>
          (opp.interest_tags || []).some(t => t.toLowerCase().includes(cat.id.toLowerCase()))
        ).length
    return { ...cat, count, icon: CATEGORY_ICONS[cat.id] || LayoutGrid }
  })

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
  const trendingTags = liveTrending && liveTrending.length > 0 ? liveTrending : FALLBACK_TRENDING_TAGS

  // ── Prop groups ──
  const filterProps = {
    categories,
    selectedCategory,
    onCategoryChange: setSelectedCategory,
    trendingTags,
    onTagClick: (tag: string) => { setSearchInput(tag); setSearchScope('skills'); setActiveTab('projects') },
    recruitingOnly,
    onRecruitingOnlyChange: setRecruitingOnly,
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
    query,
    projectCount: projectCards.length,
    peopleCount: talentCards.length,
  } as const

  const handleSelectProfile = (id: string, byUserId: boolean) => {
    setSelectedProfileId(id)
    setProfileByUserId(byUserId)
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
            categoriesCount={categories.length}
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
            peopleRecs={peopleRecs}
            isLoading={profilesLoading}
            isError={profilesError}
            onRetry={() => refetchProfiles()}
            hasMore={publicProfiles.length >= peopleDisplayLimit}
            onLoadMore={() => setPeopleDisplayLimit(prev => prev + PEOPLE_PAGE_SIZE)}
            onSelectProfile={handleSelectProfile}
          />
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
