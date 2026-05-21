import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * 프로필 OG 이미지 — 공개 프로필(/u/[id])용.
 * 알럼나이가 LinkedIn/카톡 공유 시 "누구의 어떤 이력" 한눈에.
 *
 * - profiles 에서 이름/포지션/소속/vision 만 가져옴 (RLS 의존)
 * - 나머지는 텍스트 hierarchy 로 구성 (외부 이미지 fetch 없이 edge 안정)
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  let name = 'Draft Profile'
  let position: string | null = null
  let university: string | null = null
  let bio: string | null = null

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data } = await supabase
      .from('profiles')
      .select('nickname, desired_position, university, bio, profile_visibility')
      .eq('id', id)
      .maybeSingle()

    if (data && data.profile_visibility === 'public') {
      name = data.nickname || name
      position = data.desired_position
      university = data.university
      bio = data.bio?.slice(0, 120) ?? null
    }
  } catch {
    // defaults
  }

  const initial = name.trim().slice(0, 2) || 'DR'

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
        {/* Top row: avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <div
            style={{
              width: '140px',
              height: '140px',
              borderRadius: '70px',
              backgroundColor: '#EEF2FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '56px',
              fontWeight: 800,
              color: '#0052CC',
            }}
          >
            {initial}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '56px', fontWeight: 800, color: '#262626', display: 'flex' }}>
              {name}
            </div>
            <div style={{ fontSize: '22px', color: '#555555', display: 'flex', gap: '12px' }}>
              {position && <span style={{ display: 'flex' }}>{position}</span>}
              {position && university && <span style={{ display: 'flex', color: '#AAAAAA' }}>·</span>}
              {university && <span style={{ display: 'flex' }}>{university}</span>}
            </div>
          </div>
        </div>

        {/* Middle: bio/vision */}
        {bio && (
          <div
            style={{
              fontSize: '24px',
              color: '#404040',
              lineHeight: 1.5,
              maxWidth: '1050px',
              display: 'flex',
            }}
          >
            {bio}
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
                borderRadius: '10px',
              }}
            >
              D
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#262626', display: 'flex' }}>
              Draft
            </div>
          </div>
          <div style={{ fontSize: '16px', color: '#8E8E8E', display: 'flex' }}>
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
