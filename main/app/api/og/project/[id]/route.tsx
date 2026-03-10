import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

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
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: opportunity } = await supabase
      .from('opportunities')
      .select('title, description, needed_roles, type')
      .eq('id', id)
      .single()

    if (opportunity) {
      title = opportunity.title || title
      description = (opportunity.description || '').slice(0, 100)
      roles = (opportunity.needed_roles || []).slice(0, 3)
      type = opportunity.type === 'startup' ? 'STARTUP' :
             opportunity.type === 'study' ? 'STUDY' :
             opportunity.type === 'side_project' ? 'SIDE PROJECT' : 'PROJECT'
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
          backgroundColor: '#000000',
          padding: '60px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top: Type badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#ffffff',
              border: '2px solid rgba(255,255,255,0.3)',
              padding: '6px 14px',
              letterSpacing: '2px',
            }}
          >
            {type}
          </div>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#22c55e',
              backgroundColor: 'rgba(34,197,94,0.15)',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <div style={{ width: '8px', height: '8px', backgroundColor: '#22c55e', borderRadius: '50%' }} />
            모집 중
          </div>
        </div>

        {/* Middle: Title + Description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              fontSize: '48px',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.2,
              maxWidth: '900px',
            }}
          >
            {title.length > 50 ? title.slice(0, 50) + '...' : title}
          </div>
          {description && (
            <div
              style={{
                fontSize: '20px',
                color: 'rgba(255,255,255,0.6)',
                maxWidth: '800px',
                lineHeight: 1.4,
              }}
            >
              {description}
            </div>
          )}
          {/* Role tags */}
          {roles.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              {roles.map((role) => (
                <div
                  key={role}
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#60a5fa',
                    backgroundColor: 'rgba(96,165,250,0.15)',
                    padding: '6px 16px',
                  }}
                >
                  {role}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom: Draft logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '20px',
              color: '#000000',
            }}
          >
            D
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
            Draft
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
