import * as React from 'react'

interface DigestEvent {
  id: string
  title: string
  organizer: string
  event_type: string
  registration_end_date: string
  registration_url: string | null
  interest_tags: string[]
  score?: number
}

interface WeeklyDigestEmailProps {
  userName: string
  summary: string
  recommendedEvents: DigestEvent[]
  popularEvents: DigestEvent[]
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://dailydraft.me'

export function WeeklyDigestEmail({
  userName,
  summary,
  recommendedEvents,
  popularEvents,
}: WeeklyDigestEmailProps) {
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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '32px 24px',
          borderRadius: '12px 12px 0 0',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#ffffff',
            margin: '0 0 8px 0',
          }}
        >
          DailyDraft
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.9)',
            margin: 0,
          }}
        >
          이번 주 추천 행사
        </p>
      </div>

      {/* Summary Section */}
      <div
        style={{
          backgroundColor: '#f3f4f6',
          padding: '24px',
          borderRadius: '0 0 12px 12px',
          marginBottom: '24px',
        }}
      >
        <p
          style={{
            fontSize: '16px',
            color: '#374151',
            margin: 0,
            lineHeight: '1.6',
          }}
        >
          {summary}
        </p>
      </div>

      {/* Recommended Events */}
      {recommendedEvents.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {userName}님을 위한 추천
          </h2>

          {recommendedEvents.map((event, index) => (
            <EventCard key={event.id} event={event} index={index} isLast={index === recommendedEvents.length - 1} />
          ))}
        </div>
      )}

      {/* Popular Events */}
      {popularEvents.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '16px',
            }}
          >
            이번 주 인기 행사
          </h2>

          {popularEvents.map((event, index) => (
            <EventCard key={event.id} event={event} index={index} isLast={index === popularEvents.length - 1} />
          ))}
        </div>
      )}

      {/* CTA */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '32px',
        }}
      >
        <a
          href={`${APP_URL}/events`}
          style={{
            display: 'inline-block',
            padding: '14px 28px',
            fontSize: '15px',
            fontWeight: '600',
            color: '#ffffff',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '8px',
            textDecoration: 'none',
          }}
        >
          더 많은 행사 보기
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
          매주 {userName}님의 관심사에 맞는 행사를 추천해드려요.
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
            href={`${APP_URL}/settings/notifications`}
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

function EventCard({
  event,
  index: _index,
  isLast,
}: {
  event: DigestEvent
  index: number
  isLast: boolean
}) {
  // Calculate D-day
  // eslint-disable-next-line react-hooks/purity -- Intentional: Date.now() for D-day calculation in email template
  const daysLeft = Math.ceil((new Date(event.registration_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  const badgeColor =
    daysLeft <= 3
      ? { bg: '#fef2f2', text: '#dc2626' }
      : daysLeft <= 7
      ? { bg: '#fff7ed', text: '#ea580c' }
      : { bg: '#f0fdf4', text: '#16a34a' }

  return (
    <div
      style={{
        padding: '16px',
        marginBottom: isLast ? '0' : '12px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        {/* Event Type Badge */}
        <span
          style={{
            display: 'inline-block',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: '500',
            borderRadius: '9999px',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
          }}
        >
          {event.event_type}
        </span>

        {/* D-Day Badge */}
        <span
          style={{
            display: 'inline-block',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 'bold',
            borderRadius: '9999px',
            backgroundColor: badgeColor.bg,
            color: badgeColor.text,
          }}
        >
          {daysLeft === 0 ? 'D-Day' : daysLeft > 0 ? `D-${daysLeft}` : '마감'}
        </span>
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: '15px',
          fontWeight: '600',
          color: '#111827',
          margin: '0 0 4px 0',
          lineHeight: '1.4',
        }}
      >
        {event.title}
      </h3>

      {/* Organizer */}
      <p
        style={{
          fontSize: '13px',
          color: '#6b7280',
          margin: '0 0 12px 0',
        }}
      >
        {event.organizer}
      </p>

      {/* Tags */}
      {event.interest_tags.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          {event.interest_tags.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                padding: '3px 8px',
                marginRight: '6px',
                fontSize: '11px',
                backgroundColor: '#f3f4f6',
                color: '#4b5563',
                borderRadius: '4px',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <a
          href={`${APP_URL}/events/${event.id}`}
          style={{
            display: 'inline-block',
            padding: '8px 14px',
            fontSize: '13px',
            fontWeight: '500',
            color: '#374151',
            backgroundColor: '#f3f4f6',
            borderRadius: '6px',
            textDecoration: 'none',
          }}
        >
          상세 보기
        </a>
        {event.registration_url && (
          <a
            href={event.registration_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '8px 14px',
              fontSize: '13px',
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
    </div>
  )
}

// HTML 문자열로 변환 (Resend에서 사용)
export function renderWeeklyDigestEmail(props: WeeklyDigestEmailProps): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Dynamic import for server-side only
  const ReactDOMServer = require('react-dom/server')
  return ReactDOMServer.renderToStaticMarkup(<WeeklyDigestEmail {...props} />)
}
