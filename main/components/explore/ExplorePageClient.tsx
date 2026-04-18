'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useSearchParams as useNextSearchParams, useRouter, usePathname } from 'next/navigation'
import { SkeletonGrid } from '@/components/ui/Skeleton'
import { ProfileCompletionBanner } from '@/components/ui/ProfileCompletionBanner'
import { AiMatchingNudgeCard } from '@/components/explore/AiMatchingNudgeCard'
import { StarterGuideCard } from '@/components/starter-guide/StarterGuideCard'
import { useStarterGuide } from '@/src/hooks/useStarterGuide'
import { useDiscordCarousel } from '@/src/hooks/useDiscordCarousel'
import { DiscordFeatureCarousel } from '@/components/discord/DiscordFeatureCarousel'
import { useDragScroll } from '@/src/hooks/useDragScroll'
import { CampusMap } from '@/components/explore/CampusMap'
import { timeAgo } from '@/src/lib/utils'

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
import { FALLBACK_CATEGORIES } from '@/src/lib/fallbacks/explore'
import { PEOPLE_ROLE_FILTERS } from '@/components/explore/constants'
import { positionLabel } from '@/src/constants/roles'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/src/lib/supabase/client'
import { useAuth } from '@/src/context/AuthContext'
import { useProfile } from '@/src/hooks/useProfile'
import { opportunityKeys } from '@/src/hooks/useOpportunities'
import { CATEGORY_ICONS, PAGE_SIZE, PEOPLE_PAGE_SIZE, CLUBS_PAGE_SIZE } from './constants'
import {
  ExplorePeopleGrid,
  ExploreClubGrid,
} from '@/components/explore'
import { FilterSheet } from '@/components/explore/FilterSheet'
import type { ActiveTab, SortBy, TypeFilter, SearchScope, PeopleRoleFilter, PeopleSortBy, ProjectRoleFilter, ClubCard } from '@/components/explore/types'

// ── 캠퍼스 맵 대학 데이터 (사이드 책갈피용) ──
const CAMPUS_UNIVERSITIES: { name: string; clubs: string[] }[] = [
  { name: '경희대', clubs: ['FLIP'] },
]

const normalizeUni = (raw: string) => raw.replace(/대학교$/, '대')

// ── 공개 위클리 업데이트 타입 ──
interface RecentUpdate {
  id: string
  opportunity_id: string
  week_number: number
  title: string
  content: string
  update_type: string
  created_at: string
  project_title: string | null
  project_tags: string[]
  club_name: string | null
  author_nickname: string | null
  author_avatar_url: string | null
}

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
      <div className="max-w-[1200px] mx-auto px-5 py-6">
        <SkeletonGrid count={6} cols={3} />
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
  const initialTab = (searchParams.get('tab') as ActiveTab) || 'projects'
  const [activeTab, setActiveTabState] = useState<ActiveTab>(
    ['projects', 'people', 'clubs'].includes(initialTab) ? initialTab : 'projects'
  )
  // 탭 변경 시 URL `?tab=...` 동기화. 'projects'는 기본값이라 쿼리 생략해서 URL 깔끔하게 유지.
  // 이유: 새로고침/공유 링크/뒤로가기로도 같은 탭 보존돼야 딥링크가 의미를 가짐.
  const setActiveTab = React.useCallback((tab: ActiveTab) => {
    setActiveTabState(tab)
    const params = new URLSearchParams(searchParamsRef.current.toString())
    if (tab === 'projects') params.delete('tab')
    else params.set('tab', tab)
    const qs = params.toString()
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
  }, [pathname, router])
  const [updatesBannerDismissed, setUpdatesBannerDismissed] = useState(false)
  const [recruitingOnly, setRecruitingOnly] = useState(false)
  const [peopleRoleFilter, setPeopleRoleFilter] = useState<PeopleRoleFilter>('all')
  const [peopleUniFilter, setPeopleUniFilter] = useState<string>('all')
  const [peopleClubFilter, setPeopleClubFilter] = useState<string | null>(null)
  const [projectRoleFilter, setProjectRoleFilter] = useState<ProjectRoleFilter>('all')
  const [peopleSortBy, setPeopleSortBy] = useState<PeopleSortBy>('latest')
  const [searchInput, setSearchInput] = useState(initialQuery)
  const [searchScope, setSearchScope] = useState<SearchScope>(initialScope)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)

  const searchQuery = useDebouncedValue(searchInput, 300)
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth()
  const { data: profile } = useProfile()
  const queryClient = useQueryClient()
  const guide = useStarterGuide()
  const discordCarousel = useDiscordCarousel()
  const dragRefProjects = useDragScroll()
  const dragRefUpdates = useDragScroll()
  const dragRefPeople = useDragScroll()
  const dragRefClubs = useDragScroll()

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
  const aiReasonMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of aiProjects) if (p.match_reason) map.set(p.id, p.match_reason)
    return map
  }, [aiProjects])

  // 왜 myClubs 훅 제거: Explore는 "discover" 전용으로 정리.
  // 내 클럽은 Dashboard와 Sidebar에서 관리하도록 이관 (MECE 원칙 — 한 정보는 한 곳에).

  // ── Clubs data ──
  const { data: clubsData, isLoading: clubsLoading, isError: clubsError, refetch: refetchClubs } = useQuery<{ items: ClubCard[]; total: number }>({
    queryKey: ['explore', 'clubs', searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.set('q', searchQuery)
      params.set('limit', String(CLUBS_PAGE_SIZE))
      const qs = params.toString()
      const res = await fetch(`/api/clubs${qs ? `?${qs}` : ''}`)
      if (!res.ok) return { items: [], total: 0 }
      return res.json()
    },
    staleTime: 1000 * 60 * 2,
  })
  const clubCards = clubsData?.items ?? []

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
        matchScore: aiScore ?? null,
        matchReason: aiReasonMap.get(opp.id) ?? null,
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

        if (sortBy === 'ai') {
          // AI 매칭 점수 내림차순. 점수 없는 건(0) 뒤로 밀림.
          // 왜: 지금까지 이 분기가 누락돼 AI 탭을 눌러도 trending으로 정렬되는 버그가 있었음.
          const diff = (aiScoreMap.get(b.id) ?? 0) - (aiScoreMap.get(a.id) ?? 0)
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
      // University filter (정규화된 이름으로 비교)
      if (peopleUniFilter !== 'all') {
        if (normalizeUni(profile.university || '') !== peopleUniFilter) return false
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
        locations: (profile.locations as string[] | null)?.join(', ') ?? null,
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
    [publicProfiles, peopleRoleFilter, peopleUniFilter, query, searchScope, recsMap, peopleSortBy]
  )

  // FilterSheet에 필요한 최소 데이터
  const projectCategories = useMemo(() => FALLBACK_CATEGORIES.map((cat) => {
    const count = cat.id === 'all' ? opportunities.length : opportunities.filter((opp) =>
      (opp.interest_tags || []).some(t => t.toLowerCase().includes(cat.id.toLowerCase()))
    ).length
    return { ...cat, count, icon: CATEGORY_ICONS[cat.id] || Sparkles }
  }), [opportunities])

  const handleResetFilters = useCallback(() => {
    setTypeFilter('all')
    setProjectRoleFilter('all')
    setSelectedCategory('all')
    setRecruitingOnly(false)
    setPeopleRoleFilter('all')
  }, [])

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

  // 모달 → 페이지 마이그레이션: /u/[id] 로 라우트 이동.
  // byUserId 옵션은 user_id 로 프로필 찾아야 하는 케이스 (메시지 탭 진입 등) —
  // 먼저 publicProfiles 에서 매칭 찾고, 없으면 user_id 를 그대로 id 로 넘김 (fallback).
  const handleSelectProfile = useCallback((id: string, byUserId: boolean) => {
    let targetId = id
    if (byUserId) {
      const found = publicProfiles.find((p: PublicProfile) => p.user_id === id)
      targetId = found?.id ?? id
    }
    router.push(`/u/${targetId}`)
  }, [publicProfiles, router])

  // ── 추천 피드용 데이터 ──
  // 프로젝트: AI 매칭 점수순 (점수 있는 것 우선, 없으면 기존 순서 유지)
  const feedProjects = useMemo(() =>
    [...projectCards]
      .sort((a, b) => (aiScoreMap.get(b.id) ?? 0) - (aiScoreMap.get(a.id) ?? 0))
      .slice(0, 8),
    [projectCards, aiScoreMap]
  )
  // 대학별 전체 인원수를 별도 쿼리로 빠르게 집계 (페이지네이션 무관)
  const { data: uniCountsRaw = [] } = useQuery({
    queryKey: ['university-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('university')
        .eq('profile_visibility', 'public')
        .not('university', 'is', null)
      if (error || !data) return []
      // 클라이언트에서 그룹핑 (supabase는 group by 미지원)
      const map = new Map<string, number>()
      data.forEach((row: { university: string | null }) => {
        if (!row.university) return
        const name = normalizeUni(row.university)
        map.set(name, (map.get(name) || 0) + 1)
      })
      return Array.from(map.entries()).map(([name, count]) => ({ name, count }))
    },
    staleTime: 1000 * 60 * 5,
  })

  const universityList = useMemo(() => {
    const uniMap = new Map<string, { count: number; clubs: string[] }>()
    // 캠퍼스 맵 대학 먼저 등록
    CAMPUS_UNIVERSITIES.forEach(u => {
      uniMap.set(u.name, { count: 0, clubs: u.clubs })
    })
    // DB 집계 결과 병합
    uniCountsRaw.forEach(({ name, count }) => {
      const existing = uniMap.get(name)
      if (existing) {
        existing.count = count
      } else {
        uniMap.set(name, { count, clubs: [] })
      }
    })
    return Array.from(uniMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, data]) => ({ name, count: data.count, clubs: data.clubs }))
  }, [uniCountsRaw])

  const feedPeople = talentCards.slice(0, 5)
  const feedClubs = clubCards.slice(0, 4)

  // ── 공개 위클리 업데이트 (실제 데이터) ──
  const { data: recentUpdates = [], isLoading: updatesLoading } = useQuery<RecentUpdate[]>({
    queryKey: ['project_updates', 'recent'],
    queryFn: async () => {
      const res = await fetch('/api/project-updates/recent?limit=10')
      if (!res.ok) return []
      return res.json()
    },
    staleTime: 1000 * 60 * 2,
  })

  return (
    <div className="bg-surface-bg min-h-full">
      <div className="max-w-[1200px] mx-auto px-5 pt-6 pb-16">

        {/* 배너 */}
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

        {/* Discord 기능 소개 캐러셀 — discord_user_id가 없는 유저에게만 표시 */}
        <DiscordFeatureCarousel isOpen={discordCarousel.visible} onClose={discordCarousel.dismiss} />

        {/* ── Search bar ── */}
        <div className="relative mb-5">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-tertiary pointer-events-none flex">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="프로젝트, 사람, 클럽을 검색해보세요"
            className="w-full pl-11 pr-4 py-3 text-[15px] bg-surface-sunken border border-border rounded-full text-txt-primary placeholder:text-txt-disabled focus:outline-none focus:border-brand focus:bg-surface-card focus:shadow-[0_0_0_3px_rgba(0,149,246,0.1)] transition-all"
          />
        </div>

        {/* ── Tabs ── underline에 motion layoutId 써서 탭 전환 시 bar가 슬라이드 */}
        <div className="flex border-b border-border mb-4">
          {([
            { key: 'projects' as ActiveTab, label: '추천 피드' },
            { key: 'people' as ActiveTab, label: '사람' },
            { key: 'clubs' as ActiveTab, label: '클럽' },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-5 py-3 text-[15px] font-semibold transition-colors ${
                activeTab === tab.key
                  ? 'text-txt-primary'
                  : 'text-txt-tertiary hover:text-txt-secondary'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="explore-tab-underline"
                  className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-txt-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* ── Filter chips ── */}
        {activeTab === 'people' && (
          <div className="flex items-center gap-2 mb-5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {[
              { id: 'all', label: '전체' },
              ...PEOPLE_ROLE_FILTERS.filter(r => r.id !== 'all'),
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setPeopleRoleFilter(f.id as PeopleRoleFilter)}
                className={`shrink-0 px-3.5 py-1.5 text-[13px] font-medium rounded-full border transition-colors ${
                  peopleRoleFilter === f.id
                    ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                    : 'text-txt-secondary border-border bg-surface-card hover:border-txt-tertiary'
                }`}
              >{f.label}</button>
            ))}
          </div>
        )}
        {activeTab === 'clubs' && (
          <div className="flex items-center gap-2 mb-5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {['전체', '사이드프로젝트', '스타트업', '스터디', '학회'].map((label, i) => (
              <button key={label} className={`shrink-0 px-3.5 py-1.5 text-[13px] font-medium rounded-full border transition-colors ${
                i === 0
                  ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                  : 'text-txt-secondary border-border bg-surface-card hover:border-txt-tertiary'
              }`}>{label}</button>
            ))}
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* FEED TAB                                     */}
        {/* ════════════════════════════════════════════ */}
        {activeTab === 'projects' && (
          <div>
            {/* New updates banner — 클릭하면 확인 처리 후 사라짐 */}
            {recentUpdates.length > 0 && !updatesBannerDismissed && (
              <div
                onClick={() => {
                  setUpdatesBannerDismissed(true)
                  queryClient.invalidateQueries({ queryKey: ['project_updates', 'recent'] })
                }}
                className="flex items-center justify-center gap-2 py-2.5 bg-brand-bg text-brand text-[13px] font-semibold rounded-2xl mb-4 cursor-pointer hover:bg-brand/15 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                새 업데이트 {recentUpdates.length}건이 있습니다
              </div>
            )}

            {/* Campus map — wireframe 기반 */}
            <CampusMap />

            {/* Recommendation sections */}
            <div className="flex flex-col gap-8">

              {/* ── Section 1: 내 스킬에 맞는 프로젝트 ── */}
              <section>
                <div className="flex items-baseline justify-between mb-3.5">
                  <span className="text-[16px] font-bold text-txt-primary">내 스킬에 맞는 프로젝트</span>
                  <Link href="/explore?scope=projects" className="text-[13px] text-txt-tertiary hover:text-txt-secondary transition-colors no-underline">더보기 ›</Link>
                </div>
                {opportunitiesLoading ? (
                  <SkeletonGrid count={3} cols={3} />
                ) : feedProjects.length === 0 ? (
                  <p className="text-sm text-txt-tertiary py-8 text-center">아직 추천할 프로젝트가 없습니다</p>
                ) : (
                  <div ref={dragRefProjects} className="flex gap-3 overflow-x-auto pb-2 feed-scroll">
                    {feedProjects.map(card => (
                      <div
                        key={card.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelectProject(card.id)}
                        onMouseEnter={() => handlePrefetchProject(card.id)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSelectProject(card.id) }}
                        className="shrink-0 w-[280px] bg-surface-card border border-border rounded-xl overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-[2px] transition-all duration-200 flex flex-col"
                      >
                        {/* Body */}
                        <div className="p-5 flex-1 min-h-0">
                          {/* Title */}
                          <div className="text-[15px] font-bold text-txt-primary truncate mb-1">{card.title}</div>
                          {/* Status */}
                          <div className="text-[13px] text-txt-secondary mb-3">
                            {card.roles.length > 0 ? `${card.roles[0]} 모집 중` : '팀원 모집 중'}
                          </div>
                          {/* Tags */}
                          <div className="flex gap-1.5 flex-wrap">
                            {card.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="text-xs text-brand bg-brand-bg px-2 py-0.5 rounded-full font-medium">{tag}</span>
                            ))}
                          </div>
                          {/* Match score + hover tooltip */}
                          {card.matchScore != null && card.matchScore >= 60 && (
                            <div className="relative group w-fit mt-2.5">
                              <div className={`flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-full cursor-default ${
                                card.matchScore >= 80
                                  ? 'bg-brand-bg text-brand'
                                  : 'bg-surface-sunken text-txt-secondary'
                              }`}>
                                {card.matchScore}% 매칭
                              </div>
                              {card.matchReason && (
                                <div className="absolute bottom-full left-0 mb-2 w-[220px] px-3 py-2.5 bg-surface-inverse text-txt-inverse text-[12px] leading-relaxed rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-10 pointer-events-none">
                                  {card.matchReason}
                                  <div className="absolute top-full left-4 w-2 h-2 bg-surface-inverse rotate-45 -mt-1" />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {/* Footer */}
                        <div className="flex items-center gap-2 px-5 py-3 border-t border-border text-xs text-txt-tertiary">
                          {card.daysLeft != null && card.daysLeft > 0 && (
                            <span className={card.daysLeft <= 7 ? 'text-status-danger-text font-semibold' : ''}>
                              D-{card.daysLeft}
                            </span>
                          )}
                          {card.interestCount > 0 && (
                            <>
                              <span className="text-border">·</span>
                              <span>관심 {card.interestCount}</span>
                            </>
                          )}
                          {card.updatedAt && (
                            <>
                              <span className="text-border">·</span>
                              <span>{timeAgo(card.updatedAt)} 활동</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* ── Section 2: 공개 위클리 업데이트 ── */}
              <section>
                <div className="flex items-baseline justify-between mb-3.5">
                  <span className="text-[16px] font-bold text-txt-primary">공개 위클리 업데이트</span>
                </div>
                {updatesLoading ? (
                  <SkeletonGrid count={3} cols={3} />
                ) : recentUpdates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 rounded-xl">
                    <div className="inline-flex items-center justify-center rounded-full bg-surface-sunken w-16 h-16 mb-4">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-txt-tertiary"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                    </div>
                    <p className="text-base font-semibold text-txt-primary mb-1.5">아직 공개된 업데이트가 없습니다</p>
                    <p className="text-sm text-txt-tertiary">프로젝트 팀이 주간 업데이트를 작성하면 여기에 표시됩니다</p>
                  </div>
                ) : (
                  <div ref={dragRefUpdates} className="flex gap-3 overflow-x-auto pb-2 feed-scroll">
                    {recentUpdates.map(wu => {
                      let tasksDone = 0
                      let tasksTotal = 0
                      try {
                        const parsed = JSON.parse(wu.content)
                        if (Array.isArray(parsed.tasks)) {
                          tasksTotal = parsed.tasks.length
                          tasksDone = parsed.tasks.filter((t: { done?: boolean }) => t.done).length
                        }
                      } catch { /* plain text */ }

                      const date = new Date(wu.created_at)
                      const dateLabel = `${date.getMonth() + 1}월 ${date.getDate()}일`

                      return (
                        <div
                          key={wu.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleSelectProject(wu.opportunity_id)}
                          onMouseEnter={() => handlePrefetchProject(wu.opportunity_id)}
                          onKeyDown={e => { if (e.key === 'Enter') handleSelectProject(wu.opportunity_id) }}
                          className="shrink-0 w-[280px] bg-surface-card border border-border rounded-xl overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-[2px] transition-all duration-200"
                        >
                          <div className="p-5">
                            {/* Project + club */}
                            <div className="text-[13px] text-txt-secondary mb-2 flex items-center gap-1.5">
                              <strong className="font-bold text-txt-primary truncate">{wu.project_title || wu.title}</strong>
                              {wu.club_name && (
                                <>
                                  <span className="text-txt-disabled">·</span>
                                  <span className="shrink-0">{wu.club_name}</span>
                                </>
                              )}
                            </div>
                            {/* Title */}
                            <div className="text-[15px] font-bold text-txt-primary mb-2.5">{wu.title}</div>
                            {/* Progress bar + tasks count */}
                            {tasksTotal > 0 && (
                              <div className="flex items-center gap-2.5 mb-2.5">
                                <div className="flex-1 h-1.5 bg-surface-sunken rounded-full overflow-hidden">
                                  <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${Math.round((tasksDone / tasksTotal) * 100)}%` }} />
                                </div>
                                <span className="text-[13px] font-semibold text-brand whitespace-nowrap">{tasksDone}/{tasksTotal}</span>
                              </div>
                            )}
                            {/* Meta */}
                            <div className="flex items-center gap-2 text-[13px] text-txt-tertiary">
                              <span>{wu.week_number}주차</span>
                              <span className="text-txt-disabled">·</span>
                              <span>{dateLabel}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>

              {/* ── Section 3: 프로젝트에 필요한 사람 ── */}
              <section>
                <div className="flex items-baseline justify-between mb-3.5">
                  <span className="text-[16px] font-bold text-txt-primary">프로젝트에 필요한 사람</span>
                  <button onClick={() => setActiveTab('people')} className="text-[13px] text-txt-tertiary hover:text-txt-secondary transition-colors bg-transparent border-none cursor-pointer">더보기 ›</button>
                </div>
                <div ref={dragRefPeople} className="flex gap-3 overflow-x-auto pb-2 feed-scroll">
                  {profilesLoading ? (
                    <SkeletonGrid count={3} cols={3} />
                  ) : feedPeople.length > 0 ? feedPeople.map(t => (
                    <div
                      key={t.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectProfile(t.id, false)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSelectProfile(t.id, false) }}
                      className="shrink-0 w-[200px] bg-surface-card border border-border rounded-xl overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-[2px] transition-all duration-200"
                    >
                      <div className="p-5 pt-5 flex flex-col items-center text-center gap-2">
                        {/* Avatar */}
                        <div className="w-14 h-14 rounded-full bg-brand-bg flex items-center justify-center text-xl font-bold text-brand overflow-hidden">
                          {t.avatarUrl ? (
                            <img src={t.avatarUrl} alt={t.name} className="w-full h-full object-cover" />
                          ) : (
                            t.name.substring(0, 1)
                          )}
                        </div>
                        {/* Name */}
                        <div className="text-[15px] font-bold text-txt-primary">{t.name}</div>
                        {/* University */}
                        <div className="text-[13px] text-txt-secondary">{t.university || t.role}</div>
                        {/* Role + tag */}
                        <div className="flex gap-1.5 flex-wrap justify-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-sunken text-txt-secondary">{t.role}</span>
                          {t.tags.slice(0, 1).map(tag => (
                            <span key={tag} className="text-xs text-brand bg-brand-bg px-2 py-0.5 rounded-full font-medium">{tag}</span>
                          ))}
                        </div>
                        {/* Status badge */}
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-bg text-brand">
                          팀 찾는 중
                        </span>
                        {/* Coffee chat button */}
                        <button
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-brand text-white border-none cursor-pointer hover:opacity-85 transition-opacity mt-1"
                          onClick={(e) => { e.stopPropagation(); handleSelectProfile(t.id, false) }}
                        >
                          커피챗 요청
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="w-full flex flex-col items-center justify-center py-10 rounded-xl">
                      <div className="inline-flex items-center justify-center rounded-full bg-surface-sunken w-16 h-16 mb-4">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-txt-tertiary"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                      </div>
                      <p className="text-base font-semibold text-txt-primary mb-1.5">아직 등록된 사람이 없습니다</p>
                      <p className="text-sm text-txt-tertiary">프로필을 등록한 사용자가 여기에 표시됩니다</p>
                    </div>
                  )}
                </div>
              </section>

              {/* ── Section 4: 관심 분야 클럽 ── */}
              <section>
                <div className="flex items-baseline justify-between mb-3.5">
                  <span className="text-[16px] font-bold text-txt-primary">관심 분야 클럽</span>
                  <button onClick={() => setActiveTab('clubs')} className="text-[13px] text-txt-tertiary hover:text-txt-secondary transition-colors bg-transparent border-none cursor-pointer">더보기 ›</button>
                </div>
                <div ref={dragRefClubs} className="flex gap-3 overflow-x-auto pb-2 feed-scroll">
                  {clubsLoading ? (
                    <SkeletonGrid count={3} cols={3} />
                  ) : feedClubs.length > 0 ? feedClubs.map(club => (
                    <Link
                      key={club.id}
                      href={`/clubs/${club.slug}`}
                      className="shrink-0 w-[280px] bg-surface-card border border-border rounded-xl overflow-hidden no-underline text-inherit hover:shadow-md hover:-translate-y-[2px] transition-all duration-200"
                    >
                      <div className="p-5">
                        {/* Club header: logo + info */}
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-md bg-surface-sunken flex items-center justify-center text-[13px] font-extrabold text-txt-secondary shrink-0 overflow-hidden">
                            {club.logo_url ? (
                              <img src={club.logo_url} alt={club.name} className="w-full h-full object-cover rounded-md" />
                            ) : (
                              club.name.substring(0, 3)
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-txt-primary truncate">{club.name}</span>
                              {club.category && (
                                <span className="text-[10px] font-semibold text-brand bg-brand-bg px-2.5 py-0.5 rounded-full shrink-0">{club.category}</span>
                              )}
                            </div>
                            <div className="text-xs text-txt-tertiary mt-1 flex gap-2">
                              <span>멤버 {club.member_count}명</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )) : (
                    <div className="w-full flex flex-col items-center justify-center py-10 rounded-xl">
                      <div className="inline-flex items-center justify-center rounded-full bg-surface-sunken w-16 h-16 mb-4">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-txt-tertiary"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><path d="M9 3v18" /><path d="M3 9h6" /></svg>
                      </div>
                      <p className="text-base font-semibold text-txt-primary mb-1.5">아직 등록된 클럽이 없습니다</p>
                      <p className="text-sm text-txt-tertiary">클럽이 등록되면 여기에 표시됩니다</p>
                    </div>
                  )}
                </div>
              </section>

            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* PEOPLE TAB                                   */}
        {/* ════════════════════════════════════════════ */}
        {activeTab === 'people' && (
          <div className="flex gap-5">
            {/* 사이드 책갈피 — 대학 필터 */}
            <nav className="hidden md:flex flex-col shrink-0 w-[160px] sticky top-4 self-start">
              {/* 전체 */}
              <button
                onClick={() => setPeopleUniFilter('all')}
                className={`text-left px-3 py-2 text-[13px] rounded-xl transition-all mb-1 ${
                  peopleUniFilter === 'all'
                    ? 'text-brand font-semibold bg-brand-bg'
                    : 'text-txt-secondary hover:text-txt-primary hover:bg-surface-sunken'
                }`}
              >
                전체
              </button>

              <div className="w-full h-px bg-border my-1.5" />

              {/* 실제 대학 (DB에서 추출) + 수도권 주요대학 coming soon */}
              {(() => {
                const MAJOR_UNIS = ['경희대', '서울대', '연세대', '고려대', '한양대', '홍익대', '성균관대', '서강대', '중앙대', '이화여대', '건국대', '숭실대']
                const activeUniNames = new Set(universityList.map(u => u.name))
                const activeUnis = universityList
                const comingSoonUnis = MAJOR_UNIS.filter(n => !activeUniNames.has(n))

                return (
                  <>
                    {activeUnis.map(uni => {
                      const uniSelected = peopleUniFilter === uni.name && !peopleClubFilter
                      const uniExpanded = peopleUniFilter === uni.name
                      return (
                        <div key={uni.name}>
                          <button
                            onClick={() => {
                              if (uniExpanded) {
                                setPeopleUniFilter('all')
                                setPeopleClubFilter(null)
                              } else {
                                setPeopleUniFilter(uni.name)
                                setPeopleClubFilter(null)
                              }
                            }}
                            className={`w-full text-left px-3 py-2 text-[13px] rounded-xl transition-all mb-1 flex items-center justify-between ${
                              uniSelected
                                ? 'text-brand font-semibold bg-brand-bg'
                                : uniExpanded
                                  ? 'text-txt-primary font-semibold bg-surface-sunken'
                                  : 'text-txt-primary hover:bg-surface-sunken'
                            }`}
                          >
                            <span className="truncate">{uni.name}</span>
                            <span className={`text-[11px] tabular-nums ${
                              uniExpanded ? 'text-brand/50' : 'text-txt-disabled'
                            }`}>{uni.count || ''}</span>
                          </button>
                          {/* 동아리 서브 목록 — 대학 펼쳐졌을 때 표시 */}
                          {uniExpanded && uni.clubs.length > 0 && (
                            <div className="ml-3 mb-1 flex flex-col gap-0.5">
                              {uni.clubs.map(club => (
                                <button
                                  key={club}
                                  onClick={() => setPeopleClubFilter(peopleClubFilter === club ? null : club)}
                                  className={`text-left py-1.5 px-3 text-[12px] rounded-lg transition-all ${
                                    peopleClubFilter === club
                                      ? 'text-brand font-semibold bg-brand-bg'
                                      : 'text-txt-secondary hover:bg-surface-sunken'
                                  }`}
                                >
                                  {club}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {comingSoonUnis.length > 0 && (
                      <>
                        <div className="w-full h-px bg-border my-2" />
                        {comingSoonUnis.map(name => (
                          <div
                            key={name}
                            className="pl-3 pr-2 py-2 text-[13px] text-txt-disabled mb-0.5 flex items-center justify-between cursor-default"
                          >
                            <span className="truncate">{name}</span>
                            <span className="text-[10px]">??</span>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                )
              })()}
            </nav>

            {/* 사람 그리드 */}
            <div className="flex-1 min-w-0">
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
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* CLUBS TAB                                    */}
        {/* ════════════════════════════════════════════ */}
        {activeTab === 'clubs' && (
          <div className="space-y-8">
            {/* 전체 공개 클럽 — "내 클럽" 섹션은 제거 (Dashboard/Sidebar로 이관) */}
            <div>
              <ExploreClubGrid
                clubs={clubCards}
                isLoading={clubsLoading}
                isError={clubsError}
                onRetry={() => refetchClubs()}
              />
            </div>
          </div>
        )}
      </div>

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
