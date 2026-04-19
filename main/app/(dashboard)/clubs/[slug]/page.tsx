import type { Metadata } from 'next'
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { createClient as createAnonClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { fetchClubDetail, clubDetailKey } from '@/src/lib/queries/club-queries'
import ClubPageClient from '@/components/club/ClubPageClient'
import { APP_URL } from '@/src/constants'

// 유저별 my_role 포함이라 ISR 불가 — auth 쿠키 기반 SSR
export const dynamic = 'force-dynamic'

// generateMetadata 는 auth 없이 anon 으로 조회 — 공유 링크 미리보기 크롤러 대응.
// RLS 로 public 클럽만 보이므로 private 클럽은 fallback.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data: club } = await supabase
    .from('clubs')
    .select('name, description')
    .eq('slug', slug)
    .maybeSingle()

  const title = club?.name ? `${club.name} · Draft` : 'Draft 클럽'
  const description = club?.description?.slice(0, 160) ?? '함께 만드는 프로젝트 팀'
  const ogImageUrl = `${APP_URL}/api/og/club/${slug}`

  return {
    title,
    description,
    // SEO: utm_*·ref 같은 쿼리 파라미터 공유 링크도 canonical 로 통합 → 중복 색인 방지
    alternates: {
      canonical: `${APP_URL}/clubs/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${APP_URL}/clubs/${slug}`,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

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
