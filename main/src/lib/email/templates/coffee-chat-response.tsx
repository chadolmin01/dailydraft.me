import * as React from 'react'

interface CoffeeChatResponseEmailProps {
  requesterName: string
  ownerName: string
  projectTitle: string
  accepted: boolean
  contactInfo?: string
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

export function CoffeeChatResponseEmail({
  requesterName,
  ownerName,
  projectTitle,
  accepted,
  contactInfo,
  appUrl,
}: CoffeeChatResponseEmailProps) {
  return (
    <div style={container}>
      <div style={header}>
        <span style={{ color: '#fff', fontSize: '20px', fontWeight: 900, fontFamily: 'sans-serif' }}>D</span>
        <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700, marginLeft: '12px', letterSpacing: '-0.5px' }}>Draft.</span>
      </div>

      <div style={body}>
        <p style={label}>
          COFFEE CHAT {accepted ? 'ACCEPTED' : 'DECLINED'}
        </p>
        <h1 style={heading}>
          커피챗이 {accepted ? '수락' : '거절'}되었습니다
        </h1>
        <p style={text}>
          <strong>{requesterName}</strong>님, <strong>{ownerName}</strong>님이 <strong>{projectTitle}</strong> 프로젝트 커피챗을{' '}
          {accepted ? (
            <span style={{ color: '#059669', fontWeight: 700 }}>수락</span>
          ) : (
            <span style={{ color: '#dc2626', fontWeight: 700 }}>거절</span>
          )}
          했습니다.
        </p>

        {accepted && contactInfo && (
          <div style={{
            padding: '20px',
            backgroundColor: '#f0fdf4',
            border: '2px solid #bbf7d0',
            marginBottom: '24px',
          }}>
            <p style={{ ...label, marginBottom: '8px', color: '#86efac' }}>CONTACT INFO</p>
            <p style={{ fontSize: '16px', color: '#111', fontWeight: 700, margin: 0 }}>
              {contactInfo}
            </p>
            <p style={{ fontSize: '12px', color: '#666', margin: '8px 0 0 0' }}>
              위 연락처로 직접 연락해주세요.
            </p>
          </div>
        )}

        <div style={{ textAlign: 'center' as const }}>
          <a
            href={accepted ? `${appUrl}/profile` : `${appUrl}/explore`}
            style={cta}
          >
            {accepted ? '내 커피챗 확인하기' : 'DRAFT 둘러보기'}
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

export function renderCoffeeChatResponseEmail(props: CoffeeChatResponseEmailProps): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactDOMServer = require('react-dom/server')
  return ReactDOMServer.renderToStaticMarkup(<CoffeeChatResponseEmail {...props} />)
}
