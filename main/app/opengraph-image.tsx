import { ImageResponse } from 'next/og'

export const alt = 'Draft'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0A0A0A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Subtle grid lines */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Center content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
          }}
        >
          {/* Logo mark */}
          <div
            style={{
              width: 56,
              height: 56,
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: '#0A0A0A', fontSize: 36, fontWeight: 900 }}>D</span>
          </div>

          {/* Brand name */}
          <span
            style={{
              color: '#fff',
              fontSize: 72,
              fontWeight: 900,
              letterSpacing: '-2px',
            }}
          >
            Draft.
          </span>

          {/* Tagline — matches splash screen */}
          <span
            style={{
              color: '#555',
              fontSize: 16,
              letterSpacing: '6px',
              textTransform: 'uppercase' as const,
            }}
          >
            where projects begin
          </span>

          {/* Korean subtitle */}
          <span
            style={{
              color: '#333',
              fontSize: 14,
              letterSpacing: '1px',
            }}
          >
            모든 프로젝트는 여기서 시작됩니다
          </span>
        </div>

        {/* Domain */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            right: 48,
            color: '#2a2a2a',
            fontSize: 14,
            letterSpacing: '2px',
            display: 'flex',
          }}
        >
          dailydraft.me
        </div>
      </div>
    ),
    { ...size },
  )
}
