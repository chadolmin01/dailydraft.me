import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient as createAnonClient } from '@supabase/supabase-js'
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { APP_URL } from '@/src/constants'
import { UserProfilePageClient } from './UserProfilePageClient'

// 공개 프로필 페이지 — profile.id 기반.
// 왜 `/u/` 네임스페이스: 기존 `/profile` 이 본인 프로필 editor 로 쓰이고 있어서 분리.
// SSR + ISR 60s 로 OG 크롤러 대응.
export const revalidate = 60

// anon 키로 서버 prefetch — 로그인 상태 무관, 공개 프로필만 노출.
const anonClient = createAnonClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

async function fetchPublicProfile(id: string) {
  const { data } = await anonClient
    .from('profiles')
    .select('id, user_id, nickname, desired_position, interest_tags, locations, profile_visibility, vision_summary, skills, university, major, current_situation, personality, contact_email, avatar_url, portfolio_url, github_url, linkedin_url, is_uni_verified, affiliation_type, cover_image_url, badges, bio')
    .eq('id', id)
    .eq('profile_visibility', 'public')
    .maybeSingle()
  return data
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const profile = await fetchPublicProfile(id)

  if (!profile) return { title: '프로필 · Draft' }

  const name = profile.nickname || '프로필'
  const position = profile.desired_position ? ` · ${profile.desired_position}` : ''
  const title = `${name}${position} · Draft`
  const description = profile.bio
    ? profile.bio.slice(0, 160)
    : `${name}의 Draft 프로필`

  const ogImageUrl = `${APP_URL}/api/og/profile/${id}`

  return {
    title,
    description,
    // SEO: 공유 링크에 쿼리 파라미터 붙을 때도 canonical URL 유지 → 중복 색인 방지
    alternates: {
      canonical: `${APP_URL}/u/${id}`,
    },
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `${APP_URL}/u/${id}`,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const profile = await fetchPublicProfile(id)

  if (!profile) notFound()

  // 클라이언트 React Query 캐시 prefetch — 동일 키로 useDetailedPublicProfile 재사용.
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({
    queryKey: ['public_profiles', 'detailed', 'id', id],
    queryFn: () => profile,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserProfilePageClient profileId={id} />
    </HydrationBoundary>
  )
}
