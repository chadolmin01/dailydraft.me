import * as React from 'react'
import { EmailLayout, emailStyles, emailTokens, renderEmail } from './_layout'

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

import { APP_URL } from '@/src/constants'

export function WeeklyDigestEmail({
  userName,
  summary,
  recommendedEvents,
  popularEvents,
}: WeeklyDigestEmailProps) {
  return (
    <EmailLayout
      eyebrow="이번 주 추천"
      footerNote={`매주 ${userName}님의 관심사에 맞는 행사를 추천해드립니다.`}
    >
      <h1 style={emailStyles.heading}>{userName}님을 위한 이번 주 행사</h1>

      <div style={emailStyles.card}>
        <p style={{ fontSize: '15px', color: '#374151', margin: 0, lineHeight: 1.6 }}>
          {summary}
        </p>
      </div>

      {recommendedEvents.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: emailTokens.primary, margin: '0 0 12px 0' }}>
            추천 행사
          </h2>
          {recommendedEvents.map((event, index) => (
            <EventCard key={event.id} event={event} isLast={index === recommendedEvents.length - 1} />
          ))}
        </div>
      )}

      {popularEvents.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: emailTokens.primary, margin: '0 0 12px 0' }}>
            이번 주 인기 행사
          </h2>
          {popularEvents.map((event, index) => (
            <EventCard key={event.id} event={event} isLast={index === popularEvents.length - 1} />
          ))}
        </div>
      )}

      <div style={emailStyles.ctaWrap}>
        <a href={`${APP_URL}/events`} style={emailStyles.cta}>
          더 많은 행사 보기
        </a>
      </div>
    </EmailLayout>
  )
}

function EventCard({ event, isLast }: { event: DigestEvent; isLast: boolean }) {
  // eslint-disable-next-line react-hooks/purity -- Intentional: Date.now() for D-day calc in email template
  const daysLeft = Math.ceil(
    (new Date(event.registration_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  const badge =
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
        borderRadius: '12px',
        border: `1px solid ${emailTokens.border}`,
      }}
    >
      <div style={{ marginBottom: '8px' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '4px 10px',
            marginRight: '6px',
            fontSize: '11px',
            fontWeight: 500,
            borderRadius: '9999px',
            backgroundColor: '#eff6ff',
            color: emailTokens.accent,
          }}
        >
          {event.event_type}
        </span>
        <span
          style={{
            display: 'inline-block',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 700,
            borderRadius: '9999px',
            backgroundColor: badge.bg,
            color: badge.text,
          }}
        >
          {daysLeft === 0 ? 'D-Day' : daysLeft > 0 ? `D-${daysLeft}` : '마감'}
        </span>
      </div>

      <h3 style={{ fontSize: '15px', fontWeight: 600, color: emailTokens.primary, margin: '0 0 4px 0', lineHeight: 1.4 }}>
        {event.title}
      </h3>
      <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 12px 0' }}>
        {event.organizer}
      </p>

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
                backgroundColor: emailTokens.bgMuted,
                color: '#4b5563',
                borderRadius: '4px',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div>
        <a
          href={`${APP_URL}/events/${event.id}`}
          style={{ ...emailStyles.ctaSecondary, marginRight: '8px' }}
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
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: emailTokens.primary,
              borderRadius: '8px',
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

export function renderWeeklyDigestEmail(props: WeeklyDigestEmailProps): string {
  return renderEmail(<WeeklyDigestEmail {...props} />)
}
