import * as React from 'react'
import { EmailLayout, emailStyles, emailTokens, renderEmail } from './_layout'

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
    <EmailLayout
      eyebrow="마감 임박 알림"
      footerNote="이 이메일은 북마크한 프로그램의 마감 알림입니다."
    >
      <h1 style={emailStyles.heading}>마감이 다가오는 프로그램</h1>
      <p style={emailStyles.text}>
        <strong style={{ color: emailTokens.primary }}>{userName}</strong>님, 북마크한 창업 지원 프로그램의 마감일이 다가왔습니다.
      </p>

      <div style={{ marginBottom: '24px' }}>
        {events.map((event, index) => {
          const badgeBg =
            event.daysLeft <= 1 ? '#fef2f2' : event.daysLeft <= 3 ? '#fff7ed' : '#fefce8'
          const badgeColor =
            event.daysLeft <= 1 ? '#dc2626' : event.daysLeft <= 3 ? '#ea580c' : '#ca8a04'

          return (
            <div
              key={event.id}
              style={{
                ...emailStyles.card,
                marginBottom: index < events.length - 1 ? '12px' : '24px',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  borderRadius: '9999px',
                  marginBottom: '10px',
                  backgroundColor: badgeBg,
                  color: badgeColor,
                }}
              >
                D-{event.daysLeft}
              </span>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: emailTokens.primary, margin: '0 0 4px 0' }}>
                {event.title}
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 12px 0' }}>
                {event.organizer}
              </p>
              {event.registrationUrl && (
                <a
                  href={event.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={emailStyles.ctaSecondary}
                >
                  지원하기
                </a>
              )}
            </div>
          )
        })}
      </div>

      <div style={emailStyles.ctaWrap}>
        <a href={`${appUrl}/events?tab=bookmarked`} style={emailStyles.cta}>
          저장한 프로그램 전체 보기
        </a>
      </div>
    </EmailLayout>
  )
}

export function renderDeadlineNotificationEmail(
  props: DeadlineNotificationEmailProps
): string {
  return renderEmail(<DeadlineNotificationEmail {...props} />)
}
