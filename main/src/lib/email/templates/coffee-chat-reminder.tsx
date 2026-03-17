import * as React from 'react'

interface CoffeeChatReminderEmailProps {
  ownerName: string
  requesterName: string
  projectTitle: string
  requestedAt: string
  appUrl: string
}

const container: React.CSSProperties = {
  fontFamily: '"Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  maxWidth: '520px',
  margin: '0 auto',
  padding: '0',
  backgroundColor: '#ffffff',
}

const header: React.CSSProperties = {
  backgroundColor: '#000',
  padding: '24px 32px',
  display: 'flex',
  alignItems: 'center',
}

const body: React.CSSProperties = {
  padding: '32px',
  border: '2px solid #000',
  borderTop: 'none',
}

const label: React.CSSProperties = {
  fontSize: '10px',
  fontFamily: '"JetBrains Mono", monospace',
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: '2px',
  color: '#999',
  margin: '0 0 16px 0',
}

const heading: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 700,
  color: '#111',
  margin: '0 0 12px 0',
  lineHeight: 1.4,
}

const text: React.CSSProperties = {
  fontSize: '14px',
  color: '#555',
  margin: '0 0 24px 0',
  lineHeight: 1.7,
}

const infoBox: React.CSSProperties = {
  padding: '16px 20px',
  backgroundColor: '#fafafa',
  border: '1px solid #e5e5e5',
  marginBottom: '24px',
}

const cta: React.CSSProperties = {
  display: 'inline-block',
  padding: '14px 32px',
  fontSize: '13px',
  fontWeight: 700,
  color: '#ffffff',
  backgroundColor: '#000',
  textDecoration: 'none',
  border: '2px solid #000',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
}

const footer: React.CSSProperties = {
  padding: '20px 32px',
  borderTop: '1px dashed #e5e5e5',
  textAlign: 'center' as const,
}

export function CoffeeChatReminderEmail({
  ownerName,
  requesterName,
  projectTitle,
  requestedAt,
  appUrl,
}: CoffeeChatReminderEmailProps) {
  const requestDate = new Date(requestedAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div style={container}>
      <div style={header}>
        <span style={{ color: '#fff', fontSize: '20px', fontWeight: 900, fontFamily: 'sans-serif' }}>D</span>
        <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700, marginLeft: '12px', letterSpacing: '-0.5px' }}>Draft.</span>
      </div>

      <div style={body}>
        <p style={label}>COFFEE CHAT REMINDER</p>
        <h1 style={heading}>
          {ownerName}님, 커피챗 요청이 대기 중입니다
        </h1>
        <p style={text}>
          <strong>{requesterName}</strong>님이 <strong>{projectTitle}</strong> 프로젝트에 보낸 커피챗 요청이 아직 응답을 기다리고 있습니다.
        </p>

        <div style={infoBox}>
          <p style={{ ...label, marginBottom: '8px', color: '#bbb' }}>REQUEST DATE</p>
          <p style={{ fontSize: '14px', color: '#333', margin: 0, fontWeight: 600 }}>
            {requestDate}
          </p>
          <p style={{ fontSize: '12px', color: '#999', margin: '8px 0 0 0' }}>
            빠른 응답은 좋은 인상을 남깁니다.
          </p>
        </div>

        <div style={{ textAlign: 'center' as const }}>
          <a href={`${appUrl}/profile`} style={cta}>
            지금 응답하기
          </a>
        </div>
      </div>

      <div style={footer}>
        <p style={{ fontSize: '11px', color: '#bbb', margin: 0, fontFamily: '"JetBrains Mono", monospace' }}>
          Draft — 모든 프로젝트는 여기서 시작됩니다
        </p>
      </div>
    </div>
  )
}

export function renderCoffeeChatReminderEmail(props: CoffeeChatReminderEmailProps): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactDOMServer = require('react-dom/server')
  return ReactDOMServer.renderToStaticMarkup(<CoffeeChatReminderEmail {...props} />)
}
