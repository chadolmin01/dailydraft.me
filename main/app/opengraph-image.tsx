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
          backgroundColor: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Center content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
          }}
        >
          {/* Logo mark */}
          <div
            style={{
              width: 64,
              height: 64,
              backgroundColor: '#262626',
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
            }}
          >
            WHERE PROJECTS BEGIN
          </span>
        </div>

        {/* Domain */}
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
      </div>
    ),
    { ...size },
  )
}
