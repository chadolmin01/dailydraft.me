import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { fetchMyOpportunities } from '@/src/lib/queries/profile-queries'
import DashboardClient from '@/components/dashboard/DashboardClient'

// 왜 force-dynamic: 유저별 prefetch(auth 쿠키 필요)라 ISR 불가. 매 요청마다 SSR
// 해야 HydrationBoundary에 유저별 데이터가 실린다.
export const dynamic = 'force-dynamic'

// useMyOpportunities 키와 일치시켜야 클라이언트에서 재fetch 없이 캐시를 그대로 쓴다.
// 추천 프로젝트는 /explore로 이관되어 dashboard에선 prefetch 안 함.
const MY_OPPS_KEY = (userId: string) => ['opportunities', 'my', userId] as const

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/dashboard')

  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: MY_OPPS_KEY(user.id),
    queryFn: () => fetchMyOpportunities(supabase, user.id),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardClient />
    </HydrationBoundary>
  )
}
