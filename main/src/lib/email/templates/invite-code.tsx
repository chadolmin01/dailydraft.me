import * as React from 'react'

interface InviteCodeEmailProps {
  recipientName: string
  inviteCode: string
  expiresAt: string
  appUrl: string
}

export function InviteCodeEmail({
  recipientName,
  inviteCode,
  expiresAt,
  appUrl,
}: InviteCodeEmailProps) {
  const formattedDate = new Date(expiresAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

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
      {/* Header */}
      <div
        style={{
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '20px',
          marginBottom: '24px',
        }}
      >
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#111827',
            margin: '0 0 8px 0',
          }}
        >
          DailyDraft
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: 0,
          }}
        >
          프리미엄 초대장
        </p>
      </div>

      {/* Greeting */}
      <p
        style={{
          fontSize: '16px',
          color: '#374151',
          marginBottom: '24px',
        }}
      >
        안녕하세요, <strong>{recipientName}</strong>님!
        <br />
        DailyDraft 프리미엄 서비스에 초대되셨습니다.
      </p>

      {/* Invite Code Box */}
      <div
        style={{
          padding: '24px',
          marginBottom: '24px',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          border: '2px solid #e5e7eb',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: '0 0 12px 0',
          }}
        >
          초대 코드
        </p>
        <div
          style={{
            fontSize: '32px',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            letterSpacing: '4px',
            color: '#111827',
            padding: '16px 24px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            display: 'inline-block',
          }}
        >
          {inviteCode}
        </div>
        <p
          style={{
            fontSize: '12px',
            color: '#9ca3af',
            margin: '16px 0 0 0',
          }}
        >
          유효기간: {formattedDate}까지
        </p>
      </div>

      {/* Benefits */}
      <div
        style={{
          padding: '20px',
          marginBottom: '24px',
          backgroundColor: '#eff6ff',
          borderRadius: '8px',
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#1e40af',
            margin: '0 0 12px 0',
          }}
        >
          프리미엄 혜택
        </h3>
        <ul
          style={{
            margin: 0,
            paddingLeft: '20px',
            color: '#1e40af',
            fontSize: '14px',
            lineHeight: '1.8',
          }}
        >
          <li>부스트 기능 무제한 사용</li>
          <li>프로필 스포트라이트</li>
          <li>주간 피처 기회</li>
          <li>우선 매칭 서비스</li>
        </ul>
      </div>

      {/* How to Use */}
      <div
        style={{
          marginBottom: '24px',
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#374151',
            margin: '0 0 12px 0',
          }}
        >
          사용 방법
        </h3>
        <ol
          style={{
            margin: 0,
            paddingLeft: '20px',
            color: '#6b7280',
            fontSize: '14px',
            lineHeight: '1.8',
          }}
        >
          <li>DailyDraft에 로그인하세요</li>
          <li>사이드바 메뉴에서 &quot;초대 코드 입력&quot;을 클릭하세요</li>
          <li>위 코드를 입력하면 프리미엄이 활성화됩니다</li>
        </ol>
      </div>

      {/* CTA Button */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '32px',
        }}
      >
        <a
          href={appUrl}
          style={{
            display: 'inline-block',
            padding: '14px 32px',
            fontSize: '16px',
            fontWeight: '600',
            color: '#ffffff',
            backgroundColor: '#111827',
            borderRadius: '8px',
            textDecoration: 'none',
          }}
        >
          DailyDraft 시작하기
        </a>
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: '1px solid #e5e7eb',
          paddingTop: '20px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: '12px',
            color: '#9ca3af',
            margin: '0 0 8px 0',
          }}
        >
          이 초대 코드는 본인만 사용할 수 있습니다.
        </p>
        <p
          style={{
            fontSize: '12px',
            color: '#9ca3af',
            margin: 0,
          }}
        >
          문의사항이 있으시면{' '}
          <a
            href="mailto:support@dailydraft.io"
            style={{ color: '#6b7280', textDecoration: 'underline' }}
          >
            support@dailydraft.io
          </a>
          로 연락해주세요.
        </p>
      </div>
    </div>
  )
}

// HTML 문자열로 변환 (Resend에서 사용)
export function renderInviteCodeEmail(props: InviteCodeEmailProps): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Dynamic import for server-side only
  const ReactDOMServer = require('react-dom/server')
  return ReactDOMServer.renderToStaticMarkup(<InviteCodeEmail {...props} />)
}
