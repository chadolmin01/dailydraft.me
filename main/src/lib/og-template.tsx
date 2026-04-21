import * as React from 'react'

/**
 * 페이지별 OG 이미지 공통 템플릿.
 *
 * Next.js 15 규약: 각 라우트 폴더의 opengraph-image.tsx 에서 import.
 * 1200×630, edge runtime 전제.
 */
export function renderOgTemplate({
  eyebrow,
  headline,
  subline,
  tags,
}: {
  eyebrow: string
  headline: string
  subline: string
  tags?: string[]
}) {
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#F8F9FB',
        padding: '96px 80px',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#5E6AD2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '34px',
            color: '#FFFFFF',
            borderRadius: 16,
          }}
        >
          D
        </div>
        <div style={{ fontSize: '28px', fontWeight: 700, color: '#1C1C1E', display: 'flex', letterSpacing: '-0.02em' }}>
          Draft
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: '15px', color: '#5E6AD2', fontWeight: 600, display: 'flex', padding: '8px 14px', backgroundColor: 'rgba(94, 106, 210, 0.1)', borderRadius: 12 }}>
          {eyebrow}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '960px' }}>
        <div
          style={{
            fontSize: '64px',
            fontWeight: 800,
            color: '#1C1C1E',
            lineHeight: 1.15,
            letterSpacing: '-0.025em',
            display: 'flex',
          }}
        >
          {headline}
        </div>
        <div
          style={{
            fontSize: '24px',
            color: '#3A3A3C',
            lineHeight: 1.5,
            display: 'flex',
          }}
        >
          {subline}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '24px', fontSize: '17px', color: '#8E8E93' }}>
          {(tags ?? []).map((t, i) => (
            <React.Fragment key={t}>
              {i > 0 && <span style={{ display: 'flex', color: '#D1D1D6' }}>·</span>}
              <span style={{ display: 'flex' }}>{t}</span>
            </React.Fragment>
          ))}
        </div>
        <div style={{ fontSize: '18px', color: '#5E6AD2', fontWeight: 600, display: 'flex' }}>
          dailydraft.me
        </div>
      </div>
    </div>
  )
}

export const OG_SIZE = { width: 1200, height: 630 } as const
export const OG_CONTENT_TYPE = 'image/png' as const
