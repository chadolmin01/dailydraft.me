import { notFound } from 'next/navigation'
import { createClient as createAnonClient } from '@supabase/supabase-js'
import Image from 'next/image'
import Link from 'next/link'
import { APP_URL } from '@/src/constants'

export const revalidate = 300 // 5분 ISR

/**
 * iframe 용 컴팩트 클럽 카드 — 동아리 홈페이지/노션에 붙이는 위젯.
 * 별도 `/embed` 네임스페이스에 배치해 인증/네비/기본 레이아웃 없이 깔끔한 카드만 렌더.
 */

const anonClient = createAnonClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

async function fetchClubEmbedData(slug: string) {
  const { data: club } = await anonClient
    .from('clubs')
    .select('id, name, description, logo_url, category')
    .eq('slug', slug)
    .maybeSingle()

  if (!club) return null

  const [memberCountRes, projectCountRes] = await Promise.all([
    anonClient
      .from('club_members')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', club.id)
      .eq('status', 'active'),
    anonClient
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', club.id),
  ])

  // 최근 기수 — club_members 에서 cohort 값이 있는 최신
  const { data: latestCohortRow } = await anonClient
    .from('club_members')
    .select('cohort, joined_at')
    .eq('club_id', club.id)
    .not('cohort', 'is', null)
    .order('joined_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return {
    club,
    memberCount: memberCountRes.count ?? 0,
    projectCount: projectCountRes.count ?? 0,
    latestCohort: latestCohortRow?.cohort ?? null,
  }
}

export default async function ClubEmbedPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await fetchClubEmbedData(slug)
  if (!data) notFound()

  const { club, memberCount, projectCount, latestCohort } = data

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", sans-serif',
      padding: 16,
      margin: 0,
      backgroundColor: 'transparent',
    }}>
      <Link
        href={`${APP_URL}/clubs/${slug}`}
        target="_top"
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: 20,
          borderRadius: 16,
          border: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          {club.logo_url ? (
            <Image
              src={club.logo_url}
              alt={club.name}
              width={56}
              height={56}
              style={{ borderRadius: 12, objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div style={{
              width: 56, height: 56, borderRadius: 12, backgroundColor: '#eef2ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, color: '#0052cc', flexShrink: 0,
            }}>
              {club.name[0]}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{club.name}</span>
              {club.category && (
                <span style={{
                  fontSize: 11, fontWeight: 600, color: '#0052cc',
                  backgroundColor: '#eef2ff', padding: '2px 8px', borderRadius: 999,
                }}>
                  {club.category}
                </span>
              )}
            </div>
            {club.description && (
              <p style={{
                fontSize: 12, color: '#6b7280', margin: 0, marginBottom: 8,
                lineHeight: 1.5,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
              }}>
                {club.description}
              </p>
            )}
            <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#6b7280' }}>
              <span><strong style={{ color: '#111827' }}>{memberCount}</strong> 멤버</span>
              <span style={{ color: '#d1d5db' }}>·</span>
              <span><strong style={{ color: '#111827' }}>{projectCount}</strong> 프로젝트</span>
              {latestCohort && (
                <>
                  <span style={{ color: '#d1d5db' }}>·</span>
                  <span>{latestCohort}기 진행 중</span>
                </>
              )}
            </div>
          </div>
          <div style={{
            fontSize: 11,
            color: '#9ca3af',
            textAlign: 'right' as const,
            flexShrink: 0,
          }}>
            Powered by
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0052cc' }}>Draft</div>
          </div>
        </div>
      </Link>
    </div>
  )
}
