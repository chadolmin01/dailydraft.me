import * as React from 'react'

interface CoffeeChatRequestEmailProps {
  ownerName: string
  requesterName: string
  requesterMessage: string
  projectTitle: string
  appUrl: string
}

export function CoffeeChatRequestEmail({
  ownerName,
  requesterName,
  requesterMessage,
  projectTitle,
  appUrl,
}: CoffeeChatRequestEmailProps) {
  return (
    <div
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: '#ffffff',
      }}
    >
      <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '20px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0' }}>
          Draft
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>새 커피챗 요청</p>
      </div>

      <p style={{ fontSize: '16px', color: '#374151', marginBottom: '24px' }}>
        안녕하세요, <strong>{ownerName}</strong>님!
        <br />
        <strong>{requesterName}</strong>님이 <strong>{projectTitle}</strong> 프로젝트에 커피챗을 신청했습니다.
      </p>

      <div
        style={{
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          marginBottom: '24px',
        }}
      >
        <p style={{ fontSize: '14px', color: '#374151', margin: 0, whiteSpace: 'pre-line' }}>
          {requesterMessage}
        </p>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <a
          href={`${appUrl}/profile`}
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#ffffff',
            backgroundColor: '#111827',
            borderRadius: '8px',
            textDecoration: 'none',
          }}
        >
          수락/거절하기
        </a>
      </div>

      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px', textAlign: 'center' }}>
        <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
          이 이메일은 Draft 커피챗 알림입니다.
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
