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

  // Prefetch opportunities (initial page)
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['opportunities', 'list', { limit: PAGE_SIZE }],
      queryFn: async () => {
        const { data, error, count } = await supabase
          .from('opportunities')
          .select('*', { count: 'exact' })
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .range(0, PAGE_SIZE - 1)

        if (error) throw error
        return { items: data ?? [], totalCount: count ?? 0 }
      },
    }),

    // Prefetch public profiles (initial page)
    queryClient.prefetchQuery({
      queryKey: ['public_profiles', 'list', { limit: PEOPLE_PAGE_SIZE }],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, user_id, nickname, desired_position, interest_tags, location, profile_visibility, vision_summary, avatar_url, interest_count, created_at')
          .eq('profile_visibility', 'public')
          .order('updated_at', { ascending: false })
          .limit(PEOPLE_PAGE_SIZE)

        if (error) throw error
        return data ?? []
      },
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ExplorePageClient />
    </HydrationBoundary>
  )
}
