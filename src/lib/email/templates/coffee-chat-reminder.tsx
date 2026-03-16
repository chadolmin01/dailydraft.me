import * as React from 'react'

interface CoffeeChatReminderEmailProps {
  ownerName: string
  requesterName: string
  projectTitle: string
  requestedAt: string
  appUrl: string
}

export function CoffeeChatReminderEmail({
  ownerName,
  requesterName,
  projectTitle,
  requestedAt,
  appUrl,
}: CoffeeChatReminderEmailProps) {
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
        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>커피챗 리마인더</p>
      </div>

      <p style={{ fontSize: '16px', color: '#374151', marginBottom: '24px' }}>
        안녕하세요, <strong>{ownerName}</strong>님!
        <br />
        <strong>{requesterName}</strong>님이 <strong>{projectTitle}</strong> 프로젝트에 보낸 커피챗 요청이
        아직 대기 중입니다.
      </p>

      <div
        style={{
          padding: '16px',
          backgroundColor: '#fffbeb',
          borderRadius: '8px',
          border: '1px solid #fde68a',
          marginBottom: '24px',
        }}
      >
        <p style={{ fontSize: '14px', color: '#92400e', margin: 0 }}>
          {new Date(requestedAt).toLocaleDateString('ko-KR')}에 신청된 요청입니다.
          빠른 응답은 좋은 인상을 남깁니다!
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
          지금 응답하기
        </a>
      </div>

      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px', textAlign: 'center' }}>
        <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
          이 이메일은 Draft 커피챗 리마인더입니다.
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
