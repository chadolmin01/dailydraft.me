import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { createClient } from '@supabase/supabase-js'
import ExplorePageClient from '@/components/explore/ExplorePageClient'
import { fetchClubsList } from '@/src/lib/queries/club-queries'

// ISR: revalidate every 60 seconds (no cookies() → truly static/ISR)
export const revalidate = 60

const PAGE_SIZE = 12
const PEOPLE_PAGE_SIZE = 12
const CLUBS_PAGE_SIZE = 12

// Lightweight anon client for server prefetch — no cookies, enables ISR caching
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function ExplorePage() {
  const queryClient = new QueryClient()

  // Prefetch opportunities — key must match useInfiniteOpportunities(12)
  // queryKey: ['opportunities', 'list', 'infinite', 12]
  await Promise.all([
    queryClient.prefetchInfiniteQuery({
      queryKey: ['opportunities', 'list', 'infinite', PAGE_SIZE],
      queryFn: async ({ pageParam = 0 }: { pageParam: number }) => {
        // ⚠️ CRITICAL: useInfiniteOpportunities 의 OPP_WITH_CREATOR_SELECT 와 정확히 동일해야
        // 클라 hydrate 시 club·creator 가 모두 채워진 상태로 즉시 렌더됨. shape 어긋나면 클라가
        // 다시 fetch 함 (=서버 prefetch 효과 무효화).
        // FK JOIN 실패 시 select('*') fallback — 2026-04-07 장애와 동일한 가드.
        let result = await supabase
          .from('opportunities')
          .select('*, creator:profiles!opportunities_creator_profile_fkey(id, user_id, nickname, desired_position, university, interest_tags, skills, locations, contact_email), club:clubs!opportunities_club_id_fkey(id, slug, name, logo_url)', { count: 'exact' })
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .order('id', { ascending: true })
          .range(pageParam, pageParam + PAGE_SIZE - 1)

        if (result.error) {
          result = await supabase
            .from('opportunities')
            .select('*', { count: 'exact' })
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .order('id', { ascending: true })
            .range(pageParam, pageParam + PAGE_SIZE - 1)
        }

        if (result.error) throw result.error
        return { items: result.data ?? [], totalCount: result.count ?? 0, nextOffset: pageParam + PAGE_SIZE }
      },
      initialPageParam: 0,
    }),

    // Prefetch public profiles — key must match useInfinitePublicProfiles(12)
    // queryKey: ['public_profiles', 'infinite', 12]
    queryClient.prefetchInfiniteQuery({
      queryKey: ['public_profiles', 'infinite', PEOPLE_PAGE_SIZE],
      queryFn: async ({ pageParam = 0 }: { pageParam: number }) => {
        // useInfinitePublicProfiles 와 정확히 동일한 select·order — 보조 sort `id` 가
        // 빠지면 동률 row 의 페이지 경계 흔들려서 hydrate 재페치 트리거.
        const { data, error, count } = await supabase
          .from('profiles')
          .select('id, user_id, nickname, desired_position, interest_tags, locations, profile_visibility, vision_summary, avatar_url, interest_count, created_at, badges, university, affiliation_type', { count: 'exact' })
          .eq('profile_visibility', 'public')
          .order('updated_at', { ascending: false })
          .order('id', { ascending: true })
          .range(pageParam, pageParam + PEOPLE_PAGE_SIZE - 1)

        if (error) throw error
        return { items: data ?? [], totalCount: count ?? 0, nextOffset: pageParam + PEOPLE_PAGE_SIZE }
      },
      initialPageParam: 0,
    }),

    // Prefetch clubs — key must match ExplorePageClient useQuery(['explore', 'clubs', searchQuery])
    // 빈 검색어로 초기 렌더 시 클럽 탭 클릭해도 추가 fetch 없이 즉시 표시.
    // 반환 shape은 { items, total } — 클라이언트 훅도 같은 shape 유지.
    queryClient.prefetchQuery({
      queryKey: ['explore', 'clubs', ''],
      queryFn: () => fetchClubsList(supabase, { limit: CLUBS_PAGE_SIZE }),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ExplorePageClient />
    </HydrationBoundary>
  )
}
