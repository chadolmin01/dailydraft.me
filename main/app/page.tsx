import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { createClient } from '@/src/lib/supabase/server'
import HomePageClient from '@/components/home/HomePageClient'

// Revalidate every 60 seconds so the landing page stays fresh
export const revalidate = 60

export default async function HomePage() {
  const queryClient = new QueryClient()
  const supabase = await createClient()

  // Must match the key used by useOpportunities({ limit: 3 })
  const filters = { limit: 3 }
  const queryKey = ['opportunities', 'list', filters]

  await queryClient.prefetchQuery({
    queryKey,
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact' })
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(0, 2)

      if (error) throw error
      return { items: data ?? [], totalCount: count ?? 0 }
    },
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomePageClient />
    </HydrationBoundary>
  )
}
