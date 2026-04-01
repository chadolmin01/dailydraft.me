import { ImageResponse } from 'next/og'

export const alt = 'Draft — AI로 찾는 내 프로젝트 팀'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  // Dot grid: 8 cols x 5 rows on the right panel
  const COLS = 8
  const ROWS = 5
  const BRIGHT = new Set([2, 9, 18, 28, 35]) // highlighted dots (matches)
  const MED   = new Set([1, 10, 11, 20, 27, 36, 37]) // mid-tone dots

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0A0A0A',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'sans-serif',
        }}
      >
        {/* ── Left content ─────────────────────────── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '72px 80px',
            width: 700,
            flexShrink: 0,
          }}
        >
          {/* Brand mark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 52 }}>
            <div
              style={{
                width: 40,
                height: 40,
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: '#0A0A0A', fontSize: 26, fontWeight: 900 }}>D</span>
            </div>
            <span
              style={{
                color: '#555',
                fontSize: 13,
                letterSpacing: '4px',
                textTransform: 'uppercase' as const,
              }}
            >
              DRAFT
            </span>
            <div style={{ width: 1, height: 16, background: '#333', display: 'flex', marginLeft: 4 }} />
            <span style={{ color: '#444', fontSize: 12, letterSpacing: '2px', textTransform: 'uppercase' as const }}>
              AI TEAM MATCHING
            </span>
          </div>

          {/* Headline */}
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 28 }}>
            <span
              style={{
                color: '#fff',
                fontSize: 66,
                fontWeight: 900,
                letterSpacing: '-2.5px',
                lineHeight: 1.08,
              }}
            >
              내 프로젝트에 딱 맞는
            </span>
            <span
              style={{
                color: '#fff',
                fontSize: 66,
                fontWeight: 900,
                letterSpacing: '-2.5px',
                lineHeight: 1.08,
              }}
            >
              팀원을 AI가 찾아줍니다.
            </span>
          </div>

          {/* Description */}
          <span
            style={{
              color: '#666',
              fontSize: 21,
              fontWeight: 400,
              lineHeight: 1.55,
              marginBottom: 48,
            }}
          >
            스킬 · 작업 스타일 · 목표 기반 정밀 매칭
          </span>

          {/* Feature tags */}
          <div style={{ display: 'flex', gap: 10 }}>
            {['AI 팀 매칭', '프로젝트 공유', '팀빌딩'].map((tag) => (
              <div
                key={tag}
                style={{
                  padding: '7px 16px',
                  border: '1px solid #2a2a2a',
                  color: '#666',
                  fontSize: 13,
                  letterSpacing: '0.5px',
                  display: 'flex',
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>

        {/* ── Divider ──────────────────────────────── */}
        <div
          style={{
            width: 1,
            alignSelf: 'stretch',
            background: 'linear-gradient(to bottom, transparent, #222 20%, #222 80%, transparent)',
            display: 'flex',
            flexShrink: 0,
          }}
        />

        {/* ── Right: dot-grid matching viz ─────────── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
            }}
          >
            {Array.from({ length: ROWS }).map((_, row) => (
              <div key={row} style={{ display: 'flex', gap: 22 }}>
                {Array.from({ length: COLS }).map((_, col) => {
                  const idx = row * COLS + col
                  const isBright = BRIGHT.has(idx)
                  const isMed = MED.has(idx)
                  return (
                    <div
                      key={col}
                      style={{
                        width: isBright ? 14 : 10,
                        height: isBright ? 14 : 10,
                        borderRadius: '50%',
                        background: isBright ? '#fff' : isMed ? '#3a3a3a' : '#1e1e1e',
                        boxShadow: isBright ? '0 0 12px rgba(255,255,255,0.4)' : 'none',
                        display: 'flex',
                        flexShrink: 0,
                      }}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom bar ───────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 1,
            background: '#1e1e1e',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 28,
            right: 52,
            color: '#333',
            fontSize: 13,
            letterSpacing: '1px',
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
