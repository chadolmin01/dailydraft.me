import * as React from 'react'
import { EmailLayout, emailStyles, renderEmail } from './_layout'

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
    <EmailLayout eyebrow="커피챗 요청">
      <h1 style={emailStyles.heading}>
        {requesterName}님이 커피챗을 요청했습니다
      </h1>
      <p style={emailStyles.text}>
        <strong style={{ color: '#111827' }}>{ownerName}</strong>님,{' '}
        <strong style={{ color: '#111827' }}>{projectTitle}</strong> 프로젝트에 새로운 커피챗 요청이 도착했습니다.
      </p>

      <div style={emailStyles.card}>
        <p style={emailStyles.cardLabel}>요청 메시지</p>
        <p style={{ fontSize: '14px', color: '#374151', margin: 0, whiteSpace: 'pre-line', lineHeight: 1.6 }}>
          {requesterMessage}
        </p>
      </div>

      <div style={emailStyles.ctaWrap}>
        <a href={`${appUrl}/profile`} style={emailStyles.cta}>
          수락 / 거절하기
        </a>
      </div>
    </EmailLayout>
  )
}

export function renderCoffeeChatRequestEmail(props: CoffeeChatRequestEmailProps): string {
  return renderEmail(<CoffeeChatRequestEmail {...props} />)
}
