import { ImageResponse } from 'next/og'

// iOS 홈 화면용 — 180x180 권장.

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#141413',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#faf9f5',
          fontSize: 120,
          fontWeight: 700,
          fontFamily: 'Georgia, "Times New Roman", serif',
          letterSpacing: '-0.02em',
          borderRadius: 36,
        }}
      >
        D
      </div>
    ),
    size,
  )
}
