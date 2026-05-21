import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * 클럽 OG 이미지 — /clubs/[slug] 공유 카드.
 * 클럽 이름·카테고리·멤버 수·활동 배지.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  let name = 'Draft 클럽'
  let description: string | null = null
  let category: string | null = null
  let memberCount = 0
  let university: string | null = null

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data: club } = await supabase
      .from('clubs')
      .select('id, name, description, category, visibility')
      .eq('slug', slug)
      .maybeSingle()

    if (club && club.visibility === 'public') {
      name = club.name
      description = club.description?.slice(0, 120) ?? null
      category = club.category

      const [{ count }, { data: uniBadge }] = await Promise.all([
        supabase
          .from('club_members')
          .select('*', { count: 'exact', head: true })
          .eq('club_id', club.id)
          .eq('status', 'active'),
        supabase
          .from('club_badges')
          .select('universities(name)')
          .eq('club_id', club.id)
          .eq('type', 'university')
          .maybeSingle(),
      ])
      memberCount = count ?? 0
      const uni = (uniBadge as unknown as { universities?: { name?: string } } | null)?.universities
      university = uni?.name ?? null
    }
  } catch {
    // defaults
  }

  const initial = name.trim().slice(0, 2) || 'Draft'

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF',
          padding: '72px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top row: logo block + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '24px',
              backgroundColor: '#EEF2FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '52px',
              fontWeight: 800,
              color: '#0052CC',
            }}
          >
            {initial}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '48px', fontWeight: 800, color: '#111827', display: 'flex' }}>
                {name}
              </div>
              {category && (
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#0052CC',
                    backgroundColor: '#EEF2FF',
                    padding: '6px 14px',
                    borderRadius: 999,
                    display: 'flex',
                  }}
                >
                  {category}
                </div>
              )}
            </div>
            <div style={{ fontSize: '20px', color: '#6b7280', display: 'flex', gap: '12px' }}>
              {university && <span style={{ display: 'flex' }}>{university}</span>}
              {university && <span style={{ display: 'flex', color: '#d1d5db' }}>·</span>}
              <span style={{ display: 'flex' }}>멤버 {memberCount}명</span>
            </div>
          </div>
        </div>

        {/* Middle: description */}
        {description && (
          <div
            style={{
              fontSize: '22px',
              color: '#374151',
              lineHeight: 1.5,
              maxWidth: '1000px',
              display: 'flex',
            }}
          >
            {description}
          </div>
        )}

        {/* Bottom: Draft branding */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#0052CC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '20px',
                color: '#FFFFFF',
                borderRadius: 10,
              }}
            >
              D
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827', display: 'flex' }}>
              Draft
            </div>
          </div>
          <div style={{ fontSize: '15px', color: '#9ca3af', display: 'flex' }}>
            동아리의 세대를 잇는 기록
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
