import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { fetchClubsList, fetchMyClubs } from '@/src/lib/queries/club-queries'
import ClubsListClient from '@/components/club/ClubsListClient'

// 내 클럽은 유저별이라 ISR 불가
export const dynamic = 'force-dynamic'

// 클라이언트 훅 키와 정확히 일치해야 hydrate 적중. 검색/카테고리 필터는 기본값으로
// prefetch (사용자가 필터 바꾸면 그때 re-fetch).
const CLUBS_LIST_KEY = (category: string) => ['clubs', 'list', category] as const
const MY_CLUBS_KEY = (userId: string | undefined) => ['clubs', 'my', userId] as const

export default async function ClubsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const queryClient = new QueryClient()

  // 클라 훅은 cache에 items 배열만 저장하므로(.items 추출) 같은 형태로 prefetch
  const prefetches: Promise<unknown>[] = [
    queryClient.prefetchQuery({
      queryKey: CLUBS_LIST_KEY('전체'),
      queryFn: async () => {
        const { items } = await fetchClubsList(supabase, { limit: 50 })
        return items
      },
    }),
  ]

  if (user) {
    prefetches.push(
      queryClient.prefetchQuery({
        queryKey: MY_CLUBS_KEY(user.id),
        queryFn: async () => {
          const { items } = await fetchMyClubs(supabase, user.id, 20)
          return items
        },
      }),
    )
  }

  await Promise.all(prefetches)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ClubsListClient />
    </HydrationBoundary>
  )
}
