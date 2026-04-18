import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const alt = 'Draft Club'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// 소셜 공유 시 OG 크롤러가 찍는 경로 — auth 없이 접근 가능해야 함.
// clubs 테이블은 RLS 로 visibility='public' 만 노출되므로, anon 키로 조회.
// 비공개 클럽이면 fallback 디자인 반환 (이름 노출 금지).
export default async function ClubOgImage({
  params,
}: {
  params: { slug: string }
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { data: club } = await supabase
    .from('clubs')
    .select('name, description, category')
    .eq('slug', params.slug)
    .maybeSingle()

  const clubName = club?.name ?? 'Draft Club'
  const description = club?.description?.slice(0, 80) ?? '함께 만드는 프로젝트'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* 상단: Draft 마크 + 카테고리 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              backgroundColor: '#3182F6',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: 24,
              fontWeight: 900,
            }}
          >
            D
          </div>
          <span style={{ fontSize: 20, color: '#8E8E8E', letterSpacing: 2 }}>
            Draft Club
          </span>
        </div>

        {/* 중앙: 클럽 이름 + 설명 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          <span
            style={{
              color: '#191F28',
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}
          >
            {clubName}
          </span>
          <span
            style={{
              color: '#6B7684',
              fontSize: 30,
              lineHeight: 1.4,
            }}
          >
            {description}
          </span>
        </div>

        {/* 하단: 도메인 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#8E8E8E',
            fontSize: 18,
            letterSpacing: 2,
          }}
        >
          <span>dailydraft.me</span>
          <span style={{ color: '#3182F6', fontWeight: 600 }}>
            /clubs/{params.slug}
          </span>
        </div>
      </div>
    ),
    { ...size },
  )
}
