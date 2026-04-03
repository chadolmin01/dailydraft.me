import * as React from 'react'

interface InstitutionAnnounceEmailProps {
  recipientName: string
  institutionName: string
  subject: string
  body: string
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

const bodyStyle: React.CSSProperties = {
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
  whiteSpace: 'pre-wrap' as const,
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

export function InstitutionAnnounceEmail({
  recipientName,
  institutionName,
  subject,
  body,
  appUrl,
}: InstitutionAnnounceEmailProps) {
  return (
    <div style={container}>
      <div style={header}>
        <span style={{ color: '#fff', fontSize: '20px', fontWeight: 900, fontFamily: 'sans-serif' }}>D</span>
        <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700, marginLeft: '12px', letterSpacing: '-0.5px' }}>Draft.</span>
      </div>

      <div style={bodyStyle}>
        <p style={label}>{institutionName} · ANNOUNCEMENT</p>
        <h1 style={heading}>{subject}</h1>
        <p style={{ ...text, marginBottom: '8px' }}>
          {recipientName}님,
        </p>
        <p style={text}>{body}</p>

        <div style={{ textAlign: 'center' as const }}>
          <a href={appUrl} style={cta}>
            Draft 열기
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

export function renderInstitutionAnnounceEmail(props: InstitutionAnnounceEmailProps): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactDOMServer = require('react-dom/server')
  return ReactDOMServer.renderToStaticMarkup(<InstitutionAnnounceEmail {...props} />)
}
