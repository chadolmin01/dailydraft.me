import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { APP_URL } from '@/src/constants'

/**
 * 동적 sitemap — 공개 콘텐츠를 검색 엔진에 노출.
 *
 * 포함:
 *   - 정적 공개 페이지 (/, /landing, /recruit, /guide, /login, /feed, /explore)
 *   - 공개 프로필 (/u/:id, profile_visibility='public' 만)
 *   - 공개 프로젝트 (/p/:id, status='active')
 *   - 공개 클럽 (/clubs/:slug, visibility='public')
 *
 * 제외:
 *   - 인증 필요 페이지 (dashboard, profile 편집, 관리자)
 *   - MVP hidden 페이지 (business-plan, workflow 등)
 *   - 내부 실험 라우트
 *
 * 갱신: Next.js 가 빌드 시 또는 revalidate 주기로 재생성. 대규모 사이트는 chunking 필요하지만
 * Draft 규모(수백~수천 엔티티)에선 단일 파일로 충분.
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

async function fetchPublicEntities() {
  const [profilesRes, oppsRes, clubsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, updated_at')
      .eq('profile_visibility', 'public')
      .limit(1000),
    supabase
      .from('opportunities')
      .select('id, updated_at')
      .eq('status', 'active')
      .limit(1000),
    supabase
      .from('clubs')
      .select('slug, updated_at')
      .eq('visibility', 'public')
      .limit(500),
  ])

  return {
    profiles: profilesRes.data ?? [],
    opportunities: oppsRes.data ?? [],
    clubs: clubsRes.data ?? [],
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = APP_URL

  // 정적 공개 페이지
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/landing`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/feed`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/explore`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/recruit`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/guide`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]

  // 동적 공개 엔티티 (실패 시 정적만 반환해서 sitemap 자체는 깨지지 않게)
  let dynamicRoutes: MetadataRoute.Sitemap = []
  try {
    const { profiles, opportunities, clubs } = await fetchPublicEntities()

    dynamicRoutes = [
      ...profiles.map((p) => ({
        url: `${baseUrl}/u/${p.id}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })),
      ...opportunities.map((o) => ({
        url: `${baseUrl}/p/${o.id}`,
        lastModified: o.updated_at ? new Date(o.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
      ...clubs.map((c) => ({
        url: `${baseUrl}/clubs/${c.slug}`,
        lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
    ]
  } catch (error) {
    // sitemap 생성 실패 시 정적만 반환 — 검색 엔진이 빈 sitemap 받는 것보단 낫다
    console.error('[sitemap] dynamic entities fetch failed:', error)
  }

  return [...staticRoutes, ...dynamicRoutes]
}
