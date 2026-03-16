import * as React from 'react'

interface CoffeeChatResponseEmailProps {
  requesterName: string
  ownerName: string
  projectTitle: string
  accepted: boolean
  contactInfo?: string
  appUrl: string
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
        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
          커피챗 {accepted ? '수락' : '거절'} 알림
        </p>
      </div>

      <p style={{ fontSize: '16px', color: '#374151', marginBottom: '24px' }}>
        안녕하세요, <strong>{requesterName}</strong>님!
        <br />
        <strong>{ownerName}</strong>님이 <strong>{projectTitle}</strong> 프로젝트 커피챗을{' '}
        {accepted ? (
          <span style={{ color: '#059669', fontWeight: 'bold' }}>수락</span>
        ) : (
          <span style={{ color: '#dc2626', fontWeight: 'bold' }}>거절</span>
        )}
        했습니다.
      </p>

      {accepted && contactInfo && (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#ecfdf5',
            borderRadius: '8px',
            border: '1px solid #a7f3d0',
            marginBottom: '24px',
          }}
        >
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>연락처</p>
          <p style={{ fontSize: '16px', color: '#111827', fontWeight: '600', margin: 0 }}>
            {contactInfo}
          </p>
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <a
          href={accepted ? `${appUrl}/profile` : `${appUrl}/explore`}
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
          {accepted ? '내 커피챗 확인하기' : 'Draft 둘러보기'}
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

export function renderCoffeeChatResponseEmail(props: CoffeeChatResponseEmailProps): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactDOMServer = require('react-dom/server')
  return ReactDOMServer.renderToStaticMarkup(<CoffeeChatResponseEmail {...props} />)
}
