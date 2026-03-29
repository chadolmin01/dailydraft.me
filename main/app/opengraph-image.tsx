import { ImageResponse } from 'next/og'

export const alt = 'Draft - 모든 프로젝트는 여기서 시작됩니다'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#18181B',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 80,
          position: 'relative',
        }}
      >
        {/* Corner marks */}
        <div style={{ position: 'absolute', top: 24, left: 24, width: 40, height: 40, borderTop: '3px solid #333', borderLeft: '3px solid #333', display: 'flex' }} />
        <div style={{ position: 'absolute', top: 24, right: 24, width: 40, height: 40, borderTop: '3px solid #333', borderRight: '3px solid #333', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: 24, left: 24, width: 40, height: 40, borderBottom: '3px solid #333', borderLeft: '3px solid #333', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: 24, right: 24, width: 40, height: 40, borderBottom: '3px solid #333', borderRight: '3px solid #333', display: 'flex' }} />

        {/* Logo */}
        <div
          style={{
            width: 80,
            height: 80,
            background: '#FAFAFA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          <span style={{ color: '#18181B', fontSize: 48, fontWeight: 900, fontFamily: 'sans-serif' }}>D</span>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <span
            style={{
              color: '#fff',
              fontSize: 64,
              fontWeight: 900,
              fontFamily: 'sans-serif',
              letterSpacing: '-2px',
            }}
          >
            Draft.
          </span>
          <span
            style={{
              color: '#888',
              fontSize: 24,
              fontFamily: 'sans-serif',
              fontWeight: 400,
            }}
          >
            모든 프로젝트는 여기서 시작됩니다
          </span>
        </div>

        {/* Bottom label */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            gap: 24,
          }}
        >
          <span style={{ color: '#555', fontSize: 14, fontFamily: 'monospace', letterSpacing: '2px', textTransform: 'uppercase' as const }}>
            SHARE / FEEDBACK / TEAM UP
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
