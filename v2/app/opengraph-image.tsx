import { ImageResponse } from 'next/og'

// 공유 시 OG 이미지 (1200x630). design.md 의 paper+ink + serif "Draft".

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Draft — 창업기관 매니저 워크스페이스'

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#faf9f5',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: 96,
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}
      >
        {/* D 마크 */}
        <div
          style={{
            width: 72,
            height: 72,
            background: '#141413',
            color: '#faf9f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
            fontWeight: 700,
            borderRadius: 14,
            marginBottom: 40,
            letterSpacing: '-0.02em',
          }}
        >
          D
        </div>

        {/* 워드마크 */}
        <div
          style={{
            fontSize: 96,
            color: '#141413',
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            fontWeight: 400,
          }}
        >
          Draft
        </div>

        {/* 태그라인 */}
        <div
          style={{
            marginTop: 24,
            fontSize: 32,
            color: '#6c6a64',
            fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
          }}
        >
          창업기관 매니저 워크스페이스
        </div>
      </div>
    ),
    size,
  )
}
