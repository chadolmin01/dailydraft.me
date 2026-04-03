import { ImageResponse } from 'next/og'

export const alt = 'Draft — where projects begin'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Subtle grid */}
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
            opacity: 0.4,
          }}
        />

        {/* Center content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            position: 'relative',
          }}
        >
          {/* Logo mark */}
          <div
            style={{
              width: 64,
              height: 64,
              background: '#262626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: '#FFFFFF', fontSize: 40, fontWeight: 900 }}>D</span>
          </div>

          {/* Brand name */}
          <span
            style={{
              color: '#262626',
              fontSize: 72,
              fontWeight: 900,
              letterSpacing: '-2px',
            }}
          >
            Draft.
          </span>

          {/* Tagline */}
          <span
            style={{
              color: '#8E8E8E',
              fontSize: 18,
              letterSpacing: '6px',
              textTransform: 'uppercase' as const,
            }}
          >
            where projects begin
          </span>

          {/* Korean subtitle */}
          <span
            style={{
              color: '#555555',
              fontSize: 16,
            }}
          >
            프로젝트를 공유하고, 피드백 받고, 함께할 사람을 만나세요.
          </span>
        </div>

        {/* Domain — bottom right */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            right: 48,
            color: '#8E8E8E',
            fontSize: 14,
            letterSpacing: '2px',
            display: 'flex',
          }}
        >
          dailydraft.me
        </div>

        {/* Mono label — top left */}
        <div
          style={{
            position: 'absolute',
            top: 32,
            left: 48,
            color: '#C7C7C7',
            fontSize: 11,
            letterSpacing: '4px',
            fontWeight: 700,
            display: 'flex',
          }}
        >
          DRAFT
        </div>
      </div>
    ),
    { ...size },
  )
}
