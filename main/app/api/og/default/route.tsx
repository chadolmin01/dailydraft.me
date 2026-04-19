import { ImageResponse } from 'next/og'

export const runtime = 'edge'

/**
 * 기본 OG 이미지 — 페이지별 고유 OG 이미지가 없는 공개 라우트(/, /landing, /feed, /recruit)용.
 * 루트 layout.tsx 의 openGraph.images 에서 참조.
 */
export async function GET() {
  return new ImageResponse(
    (
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
        {/* Top — Draft wordmark */}
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
          <div style={{ fontSize: '36px', fontWeight: 800, color: '#1C1C1E', display: 'flex', letterSpacing: '-0.02em' }}>
            Draft
          </div>
        </div>

        {/* Main — headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '960px' }}>
          <div
            style={{
              fontSize: '68px',
              fontWeight: 800,
              color: '#1C1C1E',
              lineHeight: 1.2,
              letterSpacing: '-0.025em',
              display: 'flex',
            }}
          >
            동아리의 세대를 잇는 인프라
          </div>
          <div
            style={{
              fontSize: '28px',
              color: '#3A3A3C',
              lineHeight: 1.5,
              display: 'flex',
            }}
          >
            대학 창업동아리·학회·프로젝트 그룹의 기록·매칭·운영을 한곳에
          </div>
        </div>

        {/* Bottom — tagline row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '32px', fontSize: '18px', color: '#8E8E93' }}>
            <span style={{ display: 'flex' }}>프로젝트 팀빌딩</span>
            <span style={{ display: 'flex', color: '#D1D1D6' }}>·</span>
            <span style={{ display: 'flex' }}>주간 업데이트</span>
            <span style={{ display: 'flex', color: '#D1D1D6' }}>·</span>
            <span style={{ display: 'flex' }}>AI 매칭</span>
          </div>
          <div style={{ fontSize: '18px', color: '#5E6AD2', fontWeight: 600, display: 'flex' }}>
            dailydraft.me
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
