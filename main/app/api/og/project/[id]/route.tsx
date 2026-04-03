import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  let title = 'Draft Project'
  let description = ''
  let roles: string[] = []
  let type = 'PROJECT'

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data: opportunity } = await supabase
      .from('opportunities')
      .select('title, description, needed_roles, type')
      .eq('id', id)
      .single()

    if (opportunity) {
      title = opportunity.title || title
      description = (opportunity.description || '').slice(0, 100)
      roles = (opportunity.needed_roles || []).slice(0, 3)
      type = opportunity.type === 'startup' ? '창업 준비' :
             opportunity.type === 'study' ? '함께 배우기' :
             opportunity.type === 'side_project' ? '함께 만들기' : 'PROJECT'
    }
  } catch {
    // Use defaults
  }

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
          padding: '60px',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Grid pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            backgroundImage:
              'linear-gradient(#E0E0E0 1px, transparent 1px), linear-gradient(90deg, #E0E0E0 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            opacity: 0.3,
          }}
        />

        {/* Top: Type badge + status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#262626',
              border: '2px solid #D0D0D0',
              padding: '6px 14px',
              letterSpacing: '2px',
            }}
          >
            {type}
          </div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#16A34A',
              backgroundColor: '#F0FDF4',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <div style={{ width: '8px', height: '8px', backgroundColor: '#16A34A', borderRadius: '50%' }} />
            모집 중
          </div>
        </div>

        {/* Middle: Title + Description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
          <div
            style={{
              fontSize: '48px',
              fontWeight: 800,
              color: '#262626',
              lineHeight: 1.2,
              maxWidth: '900px',
              letterSpacing: '-1px',
            }}
          >
            {title.length > 50 ? title.slice(0, 50) + '...' : title}
          </div>
          {description && (
            <div
              style={{
                fontSize: '20px',
                color: '#555555',
                maxWidth: '800px',
                lineHeight: 1.5,
              }}
            >
              {description}
            </div>
          )}
          {/* Role tags */}
          {roles.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              {roles.map((role) => (
                <div
                  key={role}
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#262626',
                    backgroundColor: '#F5F5F5',
                    padding: '6px 16px',
                    border: '1px solid #E0E0E0',
                  }}
                >
                  {role}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom: Draft logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              backgroundColor: '#262626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '18px',
              color: '#FFFFFF',
            }}
          >
            D
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#262626', letterSpacing: '-0.5px' }}>
            Draft.
          </div>
          <div style={{ fontSize: '13px', color: '#8E8E8E', marginLeft: '8px', display: 'flex' }}>
            dailydraft.me
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
