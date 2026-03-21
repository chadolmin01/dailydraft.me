import * as React from 'react'

interface CoffeeChatRequestEmailProps {
  ownerName: string
  requesterName: string
  requesterMessage: string
  projectTitle: string
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

const messageBox: React.CSSProperties = {
  padding: '20px',
  backgroundColor: '#fafafa',
  border: '2px solid #e5e5e5',
  marginBottom: '24px',
  position: 'relative' as const,
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

export function CoffeeChatRequestEmail({
  ownerName,
  requesterName,
  requesterMessage,
  projectTitle,
  appUrl,
}: CoffeeChatRequestEmailProps) {
  return (
    <div style={container}>
      <div style={header}>
        <span style={{ color: '#fff', fontSize: '20px', fontWeight: 900, fontFamily: 'sans-serif' }}>D</span>
        <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700, marginLeft: '12px', letterSpacing: '-0.5px' }}>Draft.</span>
      </div>

      <div style={body}>
        <p style={label}>NEW COFFEE CHAT REQUEST</p>
        <h1 style={heading}>
          {requesterName}님이 커피챗을 요청했습니다
        </h1>
        <p style={text}>
          <strong>{ownerName}</strong>님, <strong>{projectTitle}</strong> 프로젝트에 새로운 커피챗 요청이 도착했습니다.
        </p>

        <div style={messageBox}>
          <p style={{ ...label, marginBottom: '8px', color: '#bbb' }}>MESSAGE</p>
          <p style={{ fontSize: '14px', color: '#333', margin: 0, whiteSpace: 'pre-line' as const, lineHeight: 1.6 }}>
            {requesterMessage}
          </p>
        </div>

        <div style={{ textAlign: 'center' as const, marginBottom: '8px' }}>
          <a href={`${appUrl}/profile`} style={cta}>
            수락 / 거절하기
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

export function renderCoffeeChatRequestEmail(props: CoffeeChatRequestEmailProps): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactDOMServer = require('react-dom/server')
  return ReactDOMServer.renderToStaticMarkup(<CoffeeChatRequestEmail {...props} />)
}
