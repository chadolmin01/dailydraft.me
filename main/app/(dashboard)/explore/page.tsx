import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { createClient } from '@supabase/supabase-js'
import ExplorePageClient from '@/components/explore/ExplorePageClient'

// ISR: revalidate every 60 seconds (no cookies() → truly static/ISR)
export const revalidate = 60

const PAGE_SIZE = 12
const PEOPLE_PAGE_SIZE = 12

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
        // ⚠️ CRITICAL: creator FK JOIN 시도 → 실패 시 select('*') fallback
        // fallback 없이 throw하면 프로젝트 목록이 아예 안 뜸 (2026-04-07 장애)
        let result = await supabase
          .from('opportunities')
          .select('*, creator:profiles!opportunities_creator_profile_fkey(id, user_id, nickname, desired_position, university, interest_tags, skills, locations, contact_email)', { count: 'exact' })
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .range(pageParam, pageParam + PAGE_SIZE - 1)

        if (result.error) {
          result = await supabase
            .from('opportunities')
            .select('*', { count: 'exact' })
            .eq('status', 'active')
            .order('created_at', { ascending: false })
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
        const { data, error, count } = await supabase
          .from('profiles')
          .select('id, user_id, nickname, desired_position, interest_tags, locations, profile_visibility, vision_summary, avatar_url, interest_count, created_at, badges, university, affiliation_type', { count: 'exact' })
          .eq('profile_visibility', 'public')
          .order('updated_at', { ascending: false })
          .range(pageParam, pageParam + PEOPLE_PAGE_SIZE - 1)

        if (error) throw error
        return { items: data ?? [], totalCount: count ?? 0, nextOffset: pageParam + PEOPLE_PAGE_SIZE }
      },
      initialPageParam: 0,
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ExplorePageClient />
    </HydrationBoundary>
  )
}
