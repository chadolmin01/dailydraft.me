import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { fetchClubDetail, clubDetailKey } from '@/src/lib/queries/club-queries'
import ClubPageClient from '@/components/club/ClubPageClient'

// 유저별 my_role 포함이라 ISR 불가 — auth 쿠키 기반 SSR
export const dynamic = 'force-dynamic'

export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const queryClient = new QueryClient()

  // 클럽 상세만 서버 prefetch — 탭별 데이터(stats/members/projects)는 활성 탭에 따라
  // 다르게 필요하므로 클라에서 필요할 때 fetch. 어차피 Intro 탭이 기본이고 club 데이터만으로
  // 헤더·탭바가 즉시 렌더되면 체감 병목 해소됨.
  await queryClient.prefetchQuery({
    queryKey: clubDetailKey(slug),
    queryFn: () => fetchClubDetail(supabase, slug, user?.id ?? null),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ClubPageClient />
    </HydrationBoundary>
  )
}
