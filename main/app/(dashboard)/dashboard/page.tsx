import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { fetchMyOpportunities } from '@/src/lib/queries/profile-queries'
import DashboardClient from '@/components/dashboard/DashboardClient'

// 왜 force-dynamic: 유저별 prefetch(auth 쿠키 필요)라 ISR 불가. 매 요청마다 SSR
// 해야 HydrationBoundary에 유저별 데이터가 실린다.
export const dynamic = 'force-dynamic'

// useMyOpportunities / useRecommendedOpportunities 키와 정확히 일치시켜야
// 클라이언트에서 재fetch 없이 캐시를 그대로 쓴다. 틀리면 hydrate miss로
// 이중 fetch 발생해서 prefetch 의미 없어짐.
const MY_OPPS_KEY = (userId: string) => ['opportunities', 'my', userId] as const
const RECOMMENDED_OPPS_KEY = (userId: string) => ['opportunities', 'recommended', userId] as const

const OPP_WITH_CREATOR_SELECT = '*, creator:profiles!opportunities_creator_profile_fkey(id, user_id, nickname, desired_position, university, interest_tags, skills, locations, contact_email), club:clubs!opportunities_club_id_fkey(id, slug, name, logo_url)'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/dashboard')

  const queryClient = new QueryClient()

  await Promise.all([
    // 내 프로젝트
    queryClient.prefetchQuery({
      queryKey: MY_OPPS_KEY(user.id),
      queryFn: () => fetchMyOpportunities(supabase, user.id),
    }),
    // 추천 프로젝트 — useRecommendedOpportunities(4) 쿼리와 동일 쿼리/필터여야 캐시 일치
    queryClient.prefetchQuery({
      queryKey: RECOMMENDED_OPPS_KEY(user.id),
      queryFn: async () => {
        const { data, error } = await supabase
          .from('opportunities')
          .select(OPP_WITH_CREATOR_SELECT)
          .eq('status', 'active')
          .neq('creator_id', user.id)
          .order('created_at', { ascending: false })
          .order('id', { ascending: true })
          .limit(4)
        if (error) throw error
        return data ?? []
      },
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardClient />
    </HydrationBoundary>
  )
}
