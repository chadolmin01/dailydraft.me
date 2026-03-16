import * as React from 'react'

interface DeadlineNotificationEmailProps {
  userName: string
  events: Array<{
    id: string
    title: string
    organizer: string
    daysLeft: number
    registrationUrl: string | null
  }>
  appUrl: string
}

export function DeadlineNotificationEmail({
  userName,
  events,
  appUrl,
}: DeadlineNotificationEmailProps) {
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
          마감 임박 알림
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
        안녕하세요, <strong>{userName}</strong>님!
        <br />
        북마크한 창업 지원 프로그램의 마감일이 다가왔습니다.
      </p>

      {/* Events List */}
      <div style={{ marginBottom: '24px' }}>
        {events.map((event, index) => (
          <div
            key={event.id}
            style={{
              padding: '16px',
              marginBottom: index < events.length - 1 ? '12px' : '0',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}
          >
            {/* D-Day Badge */}
            <span
              style={{
                display: 'inline-block',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 'bold',
                borderRadius: '9999px',
                marginBottom: '8px',
                backgroundColor: event.daysLeft <= 1 ? '#fef2f2' : event.daysLeft <= 3 ? '#fff7ed' : '#fefce8',
                color: event.daysLeft <= 1 ? '#dc2626' : event.daysLeft <= 3 ? '#ea580c' : '#ca8a04',
              }}
            >
              D-{event.daysLeft}
            </span>

            {/* Title */}
            <h3
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827',
                margin: '0 0 4px 0',
              }}
            >
              {event.title}
            </h3>

            {/* Organizer */}
            <p
              style={{
                fontSize: '14px',
                color: '#6b7280',
                margin: '0 0 12px 0',
              }}
            >
              {event.organizer}
            </p>

            {/* CTA Button */}
            {event.registrationUrl && (
              <a
                href={event.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ffffff',
                  backgroundColor: '#2563eb',
                  borderRadius: '6px',
                  textDecoration: 'none',
                }}
              >
                지원하기
              </a>
            )}
          </div>
        ))}
      </div>

      {/* View All Link */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '32px',
        }}
      >
        <a
          href={`${appUrl}/events?tab=bookmarked`}
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#2563eb',
            backgroundColor: '#eff6ff',
            borderRadius: '6px',
            textDecoration: 'none',
          }}
        >
          저장한 프로그램 전체 보기
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
          이 이메일은 북마크한 프로그램의 마감 알림입니다.
        </p>
        <p
          style={{
            fontSize: '12px',
            color: '#9ca3af',
            margin: 0,
          }}
        >
          알림 설정은{' '}
          <a
            href={`${appUrl}/notifications`}
            style={{ color: '#6b7280', textDecoration: 'underline' }}
          >
            여기
          </a>
          에서 변경할 수 있습니다.
        </p>
      </div>
    </div>
  )
}

// HTML 문자열로 변환 (Resend에서 사용)
export function renderDeadlineNotificationEmail(
  props: DeadlineNotificationEmailProps
): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Dynamic import for server-side only
  const ReactDOMServer = require('react-dom/server')
  return ReactDOMServer.renderToStaticMarkup(
    <DeadlineNotificationEmail {...props} />
  )
}
