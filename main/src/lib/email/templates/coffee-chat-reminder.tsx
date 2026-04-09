import * as React from 'react'
import { EmailLayout, emailStyles, renderEmail } from './_layout'

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
  const requestDate = new Date(requestedAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <EmailLayout eyebrow="커피챗 리마인더">
      <h1 style={emailStyles.heading}>
        {ownerName}님, 커피챗 요청이 대기 중입니다
      </h1>
      <p style={emailStyles.text}>
        <strong style={{ color: '#111827' }}>{requesterName}</strong>님이{' '}
        <strong style={{ color: '#111827' }}>{projectTitle}</strong> 프로젝트에 보낸 커피챗 요청이 아직 응답을 기다리고 있습니다.
      </p>

      <div style={emailStyles.card}>
        <p style={emailStyles.cardLabel}>요청일</p>
        <p style={{ fontSize: '15px', color: '#111827', margin: 0, fontWeight: 600 }}>
          {requestDate}
        </p>
        <p style={{ fontSize: '13px', color: '#6b7280', margin: '8px 0 0 0' }}>
          빠른 응답은 좋은 인상을 남깁니다.
        </p>
      </div>

      <div style={emailStyles.ctaWrap}>
        <a href={`${appUrl}/profile`} style={emailStyles.cta}>
          지금 응답하기
        </a>
      </div>
    </EmailLayout>
  )
}

export function renderCoffeeChatReminderEmail(props: CoffeeChatReminderEmailProps): string {
  return renderEmail(<CoffeeChatReminderEmail {...props} />)
}
