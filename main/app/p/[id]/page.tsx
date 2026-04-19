import type { Metadata } from 'next'
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data: opportunity } = await supabase
      .from('opportunities')
      .select('title, description, interest_tags, type')
      .eq('id', id)
      .single()

    if (!opportunity) {
      return {
        title: '프로젝트를 찾을 수 없습니다 | Draft',
      }
    }

    const title = `${opportunity.title} | Draft`
    const description = opportunity.description?.slice(0, 160) || '대학생 프로젝트 공유 플랫폼 Draft'
    const appUrl = APP_URL

    return {
      title,
      description,
      // SEO: 쿼리 파라미터 있는 공유 링크도 canonical 로 통합 → 중복 색인 방지
      alternates: {
        canonical: `${appUrl}/p/${id}`,
      },
      openGraph: {
        title: opportunity.title,
        description,
        type: 'website',
        url: `${appUrl}/p/${id}`,
        images: [
          {
            url: `${appUrl}/api/og/project/${id}`,
            width: 1200,
            height: 630,
            alt: opportunity.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: opportunity.title,
        description,
        images: [`${appUrl}/api/og/project/${id}`],
      },
    }
  } catch {
    return {
      title: 'Draft',
      description: '대학생 프로젝트 공유 플랫폼',
    }
  }
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params

  // JSON-LD 구조화 데이터 — Rich Result 후보. 서버에서 prefetch 후 <script> 주입.
  // 실패해도 페이지 자체는 렌더되므로 try/catch 로 감쌈.
  let jsonLd: Record<string, unknown> | null = null
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: opp } = await supabase
      .from('opportunities')
      .select('title, description, interest_tags, type, created_at, updated_at')
      .eq('id', id)
      .single()

    if (opp) {
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
  } catch {
    // JSON-LD 생성 실패는 조용히 스킵 — 페이지 렌더는 진행
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
      <ProjectDetailClient id={id} />
    </>
  )
}
