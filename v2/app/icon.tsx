import { ImageResponse } from 'next/og'

// Next.js 14 동적 favicon — design.md 의 ink + canvas 톤으로 "D" 마크.
// /favicon.ico 자동 응답 + <link rel="icon"> 자동 주입.

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
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
          fontSize: 22,
          fontWeight: 700,
          fontFamily: 'Georgia, "Times New Roman", serif',
          letterSpacing: '-0.02em',
        }}
      >
        D
      </div>
    ),
    size,
  )
}
