import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { createClient } from '@/src/lib/supabase/server'
import ExplorePageClient from '@/components/explore/ExplorePageClient'

// Revalidate every 60 seconds
export const revalidate = 60

const PAGE_SIZE = 12
const PEOPLE_PAGE_SIZE = 12

export default async function ExplorePage() {
  const queryClient = new QueryClient()
  const supabase = await createClient()

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
