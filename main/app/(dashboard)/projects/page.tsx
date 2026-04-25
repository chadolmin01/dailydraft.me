import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { fetchMyOpportunities, opportunityKeys } from '@/src/lib/queries/profile-queries'
import MyProjectsClient from './client'

// 유저별 prefetch(auth 쿠키 필요)라 ISR 불가. 매 요청 SSR 해야 hydrate 가 유효.
export const dynamic = 'force-dynamic'

export default async function MyProjectsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/projects')

  // useMyOpportunities() 와 동일 키 — 직접 진입 시도 캐시 hit, 스켈레톤 회피.
  // dashboard 에서 들어오는 케이스는 이미 prefetch 되어 있음 (중복 캐시는 React Query 가 dedupe).
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({
    queryKey: opportunityKeys.my(user.id),
    queryFn: () => fetchMyOpportunities(supabase, user.id),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MyProjectsClient />
    </HydrationBoundary>
  )
}
