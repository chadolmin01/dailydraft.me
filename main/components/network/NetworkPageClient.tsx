'use client'

import { useState, useMemo, useEffect, useRef, useCallback, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence } from 'framer-motion'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { ExplorePeopleGrid } from '@/components/explore'
import { PEOPLE_ROLE_FILTERS } from '@/components/explore/constants'
import { SortPill } from '@/components/explore/SortPill'
import { SkeletonGrid } from '@/components/ui/Skeleton'
import { useInfinitePublicProfiles, type PublicProfile } from '@/src/hooks/usePublicProfiles'
import { useUserRecommendations } from '@/src/hooks/useUserRecommendations'
import { cleanNickname } from '@/src/lib/clean-nickname'
import { positionLabel } from '@/src/constants/roles'
import { resetMatchImpressionDedup } from '@/src/lib/analytics/match-tracking'
import type { PeopleRoleFilter, PeopleSortBy } from '@/components/explore/types'

/**
 * /network — 사람 탐색 독립 라우트.
 *
 * 왜 별도 라우트: `/explore?tab=people`의 사람 찾기를 /projects·/clubs와 대칭되는 전용
 * 라우트로 승격. 공유 링크(`/network`)가 의미를 갖고, 사이드바 직접 진입 가능.
 *
 * 역할 범위:
 *   - 매칭 추천 + 검색 + 역할 필터 + 정렬 (정렬: 추천/최신/인기)
 *   - 프로필 클릭 → ProfileDetailModal (URL `?profile=...`)
 *
 * 범위 밖 (Explore 탭에만 유지):
 *   - 대학·클럽 계층 사이드 네비 — 탐색용 탐사 경험은 Explore가 소유
 */

const ProfileDetailModal = dynamic(
  () => import('@/components/ProfileDetailModal').then(m => ({ default: m.ProfileDetailModal })),
  { ssr: false }
)

function useDebounced<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

export default function NetworkPageClient() {
  return (
    <Suspense fallback={<NetworkFallback />}>
      <NetworkContent />
    </Suspense>
  )
}

function NetworkFallback() {
  return (
    <div className="bg-surface-bg min-h-full">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SkeletonGrid count={8} cols={4} />
      </div>
    </div>
  )
}

function NetworkContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const selectedProfileId = searchParams.get('profile')
  const profileByUserId = searchParams.get('profileBy') === 'userId'

  const searchParamsRef = useRef(searchParams)
  searchParamsRef.current = searchParams

  const replaceParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParamsRef.current.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v === null) params.delete(k)
      else params.set(k, v)
    }
    const qs = params.toString()
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
  }, [pathname, router])

  const initialQuery = searchParams.get('q') || ''
  const [searchInput, setSearchInput] = useState(initialQuery)
  const query = useDebounced(searchInput, 300).toLowerCase().trim()
  const [roleFilter, setRoleFilter] = useState<PeopleRoleFilter>('all')
  const [sortBy, setSortBy] = useState<PeopleSortBy>('ai')

  useEffect(() => {
    const params = new URLSearchParams(searchParamsRef.current.toString())
    if (query) params.set('q', query)
    else params.delete('q')
    const qs = params.toString()
    const next = `${pathname}${qs ? `?${qs}` : ''}`
    const curQs = searchParamsRef.current.toString()
    const cur = `${pathname}${curQs ? `?${curQs}` : ''}`
    if (next !== cur) router.replace(next, { scroll: false })
  }, [query, pathname, router])

  const {
    data: pages,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfinitePublicProfiles(12)
  const profiles = useMemo(() => pages?.pages.flatMap(p => p.items) ?? [], [pages])
  const { data: allRecs = [], isLoading: isRecsLoading } = useUserRecommendations({ limit: 50 })
  const recsMap = useMemo(() => {
    const m = new Map<string, { match_score: number; match_reason: string }>()
    for (const r of allRecs) m.set(r.user_id, { match_score: r.match_score, match_reason: r.match_reason })
    return m
  }, [allRecs])

  // AI 추천 데이터가 비어있으면 (온보딩 미완료/매치 데이터 부족) 'ai' 정렬은 모든 카드를
  // 필터링해서 빈 화면이 됨 → 'latest' 로 자동 폴백 + 안내 배너 노출.
  // 추천 로딩 중에는 폴백하지 않음 (스켈레톤 → 추천 도착 → 즉시 사라지는 깜빡임 방지).
  const aiFallbackToLatest = sortBy === 'ai' && !isRecsLoading && recsMap.size === 0
  const effectiveSort: PeopleSortBy = aiFallbackToLatest ? 'latest' : sortBy

  // 정렬 변경 시 임프레션 dedup 리셋 — 같은 카드가 다른 정렬에서 다시 노출되면 새 임프레션으로 셈.
  useEffect(() => {
    resetMatchImpressionDedup()
  }, [effectiveSort])

  // matchData는 ProfileDetailModal에서 자체적으로 /api/user-recommendations를 다시 호출해서 가져옴.
  // 여기선 선택한 프로필에 대한 score만 돕고 싶으면 useUserRecommendations의 full rec 객체 필요 —
  // 현재 훅은 full payload 반환 안 하므로 modal에 null 넘기고 modal이 자체 fetch 하도록 둠.
  const selectedMatchData = null

  const talentCards = useMemo(() => profiles
    .filter((profile: PublicProfile) => {
      if (roleFilter !== 'all') {
        const def = PEOPLE_ROLE_FILTERS.find(f => f.id === roleFilter)
        if (def && 'positionSlugs' in def) {
          if (!(def as { positionSlugs: string[] }).positionSlugs.includes(profile.desired_position || '')) return false
        }
      }
      if (!query) return true
      const name = (profile.nickname || '').toLowerCase()
      const role = (profile.desired_position || '').toLowerCase()
      const tags = (profile.interest_tags || []).join(' ').toLowerCase()
      const uni = (profile.university || '').toLowerCase()
      return name.includes(query) || role.includes(query) || tags.includes(query) || uni.includes(query)
    })
    .map((profile: PublicProfile) => {
      const rec = recsMap.get(profile.user_id)
      let visionText: string | null = null
      if (profile.vision_summary) {
        try { visionText = JSON.parse(profile.vision_summary).summary || null }
        catch { visionText = profile.vision_summary }
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
    .filter(card => {
      if (effectiveSort === 'ai') return card.matchScore != null && card.matchScore > 0
      return true
    })
    .sort((a, b) => {
      const tie = a.id.localeCompare(b.id)
      if (effectiveSort === 'ai') return ((b.matchScore ?? 0) - (a.matchScore ?? 0)) || tie
      if (effectiveSort === 'popular') return ((b.interestCount || 0) - (a.interestCount || 0)) || tie
      return (new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()) || tie
    }),
    [profiles, roleFilter, query, recsMap, effectiveSort]
  )

  const handleSelectProfile = (id: string, byUserId: boolean) => {
    replaceParams({ profile: id, profileBy: byUserId ? 'userId' : null })
  }

  return (
    <div className="bg-surface-bg min-h-full">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">

        {/* 헤더 */}
        <div className="mb-5">
          <h1 className="text-[24px] sm:text-[28px] font-bold text-txt-primary tracking-tight">사람 탐색</h1>
          <p className="text-[13px] text-txt-tertiary mt-1">함께할 팀원·멘토·동료를 찾습니다</p>
        </div>

        {/* AI 추천 데이터 부족 → 최신순 폴백 안내. AI 인터뷰/프로필 보강 유도 */}
        {aiFallbackToLatest && (
          <div className="mb-5 px-4 py-3 bg-surface-card border border-border rounded-xl flex items-start gap-3">
            <span className="text-[12px] font-bold text-brand mt-0.5">AI</span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-txt-primary">맞춤 추천 데이터가 아직 없어 최신순으로 보여드립니다</p>
              <p className="text-[12px] text-txt-tertiary mt-0.5">
                AI 인터뷰를 끝내고 프로필을 채우시면 4축(스킬·관심·상황·팀핏) 기반으로 맞춤 정렬이 켜집니다.
              </p>
            </div>
            <a
              href="/profile"
              className="shrink-0 text-[12px] font-semibold text-brand hover:underline self-center"
            >
              프로필 보강
            </a>
          </div>
        )}

        {/* 검색 */}
        <div className="relative mb-4">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-tertiary pointer-events-none flex">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="이름·대학·역할·관심사로 검색"
            className="w-full pl-11 pr-4 py-3 text-[15px] bg-surface-sunken border border-border rounded-full text-txt-primary placeholder:text-txt-disabled focus:outline-hidden focus:border-brand focus:bg-surface-card focus:shadow-[0_0_0_3px_rgba(94,106,210,0.15)] transition-all"
          />
        </div>

        {/* 필터 + 정렬 */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2 overflow-x-auto flex-1" style={{ scrollbarWidth: 'none' }}>
            {[{ id: 'all', label: '전체' }, ...PEOPLE_ROLE_FILTERS.filter(r => r.id !== 'all')].map(f => (
              <button
                key={f.id}
                onClick={() => setRoleFilter(f.id as PeopleRoleFilter)}
                className={`shrink-0 px-3.5 py-1.5 text-[13px] font-medium rounded-full border transition-colors ${
                  roleFilter === f.id
                    ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                    : 'text-txt-secondary border-border bg-surface-card hover:border-txt-tertiary'
                }`}
              >{f.label}</button>
            ))}
          </div>
          <SortPill
            value={sortBy}
            onChange={setSortBy}
            options={[
              { id: 'ai', label: '추천' },
              { id: 'latest', label: '최신' },
              { id: 'popular', label: '인기' },
            ]}
          />
        </div>

        {/* 그리드 */}
        <ExplorePeopleGrid
          talentCards={talentCards}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          hasMore={hasNextPage ?? false}
          isFetchingMore={isFetchingNextPage}
          onLoadMore={() => fetchNextPage()}
          onSelectProfile={handleSelectProfile}
          peopleSortBy={sortBy}
          trackingSurface="network"
        />
      </div>

      <AnimatePresence>
        {selectedProfileId && (
          <ProfileDetailModal
            key="profile-modal"
            profileId={selectedProfileId}
            byUserId={profileByUserId}
            matchData={selectedMatchData}
            onClose={() => replaceParams({ profile: null, profileBy: null })}
            onSelectProject={() => {}}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
