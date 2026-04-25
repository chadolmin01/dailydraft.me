import type { Metadata } from 'next'
import { cache } from 'react'
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { createClient } from '@supabase/supabase-js'
import { APP_URL } from '@/src/constants'
import { ProjectDetailClient } from './client'

// ISR: 공개 프로젝트 상세 페이지는 5분 캐시.
// 왜 5분: OG 크롤러·공유 링크 대상이라 SEO 중요. 프로젝트 정보 변경 빈도 고려 시 5분이 적절.
// `/u/[id]` 의 60s 보다 길게 — 프로젝트는 프로필보다 변화 덜 잦음.
export const revalidate = 300

interface Props {
  params: Promise<{ id: string }>
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// useOpportunity(id) 와 동일한 select shape 유지 — creator·club FK JOIN 포함.
// 이 shape 으로 React Query cache 를 미리 채워서 클라 진입 시 추가 fetch 없이 즉시 렌더.
// JOIN 실패 시 select('*') fallback — 2026-04-07 장애와 동일한 가드.
const OPP_DETAIL_SELECT =
  '*, creator:profiles!opportunities_creator_profile_fkey(id, user_id, nickname, desired_position, university, interest_tags, skills, locations, contact_email), club:clubs!opportunities_club_id_fkey(id, slug, name, logo_url)'

// React `cache()` 로 메모이제이션 — 같은 요청 안에서 generateMetadata + default export 가
// 동일한 id 로 호출하면 1회 fetch 로 dedupe 됨. (Next.js App Router 권장 패턴)
const fetchOpportunity = cache(async (id: string) => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  let result = await supabase
    .from('opportunities')
    .select(OPP_DETAIL_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (result.error) {
    // FK JOIN 실패 시 fallback — 페이지 자체는 살려야 하므로
    result = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', id)
      .maybeSingle()
  }

  return result.data ?? null
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const opportunity = await fetchOpportunity(id)

  if (!opportunity) {
    return {
      title: '프로젝트를 찾을 수 없습니다 | Draft',
    }
  }

  const oppRecord = opportunity as { title: string; description?: string | null }
  const title = `${oppRecord.title} | Draft`
  const description = oppRecord.description?.slice(0, 160) || '대학생 프로젝트 공유 플랫폼 Draft'
  const appUrl = APP_URL

  return {
    title,
    description,
    // SEO: 쿼리 파라미터 있는 공유 링크도 canonical 로 통합 → 중복 색인 방지
    alternates: {
      canonical: `${appUrl}/p/${id}`,
    },
    openGraph: {
      title: oppRecord.title,
      description,
      type: 'website',
      url: `${appUrl}/p/${id}`,
      images: [
        {
          url: `${appUrl}/api/og/project/${id}`,
          width: 1200,
          height: 630,
          alt: oppRecord.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: oppRecord.title,
      description,
      images: [`${appUrl}/api/og/project/${id}`],
    },
  }
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params
  const opportunity = await fetchOpportunity(id)

  // React Query prefetch — useOpportunity(id) 와 동일 키 (`['opportunities', 'detail', id]`)
  // 로 hydrate. 클라 진입 시 스켈레톤 없이 즉시 ProjectDetail 본문이 보임.
  const queryClient = new QueryClient()
  if (opportunity) {
    await queryClient.prefetchQuery({
      queryKey: ['opportunities', 'detail', id],
      queryFn: () => opportunity,
    })
  }

  // JSON-LD 구조화 데이터 — Rich Result 후보.
  let jsonLd: Record<string, unknown> | null = null
  if (opportunity) {
    const opp = opportunity as {
      title: string
      description?: string | null
      interest_tags?: string[] | null
      created_at?: string | null
      updated_at?: string | null
    }
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: opp.title,
      description: opp.description?.slice(0, 500) ?? undefined,
      url: `${APP_URL}/p/${id}`,
      image: `${APP_URL}/api/og/project/${id}`,
      dateCreated: opp.created_at,
      dateModified: opp.updated_at ?? opp.created_at,
      keywords: Array.isArray(opp.interest_tags) ? opp.interest_tags.join(', ') : undefined,
      isAccessibleForFree: true,
      publisher: {
        '@type': 'Organization',
        name: 'Draft',
        url: APP_URL,
      },
    }
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ProjectDetailClient id={id} />
      </HydrationBoundary>
    </>
  )
}
