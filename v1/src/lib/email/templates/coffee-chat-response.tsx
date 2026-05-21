import * as React from 'react'
import { EmailLayout, emailStyles, renderEmail } from './_layout'

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
    <EmailLayout eyebrow={accepted ? '커피챗 수락' : '커피챗 응답'}>
      <h1 style={emailStyles.heading}>
        커피챗이 {accepted ? '수락' : '거절'}되었습니다
      </h1>
      <p style={emailStyles.text}>
        <strong style={{ color: '#111827' }}>{requesterName}</strong>님,{' '}
        <strong style={{ color: '#111827' }}>{ownerName}</strong>님이{' '}
        <strong style={{ color: '#111827' }}>{projectTitle}</strong> 프로젝트 커피챗을{' '}
        <strong style={{ color: '#111827' }}>{accepted ? '수락' : '거절'}</strong>했습니다.
      </p>

      {accepted && contactInfo && (
        <div style={emailStyles.card}>
          <p style={emailStyles.cardLabel}>연락처</p>
          <p style={{ fontSize: '16px', color: '#111827', fontWeight: 700, margin: 0 }}>
            {contactInfo}
          </p>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '8px 0 0 0' }}>
            위 연락처로 직접 연락해주세요.
          </p>
        </div>
      )}

      <div style={emailStyles.ctaWrap}>
        <a
          href={accepted ? `${appUrl}/profile` : `${appUrl}/explore`}
          style={emailStyles.cta}
        >
          {accepted ? '내 커피챗 확인하기' : 'Draft 둘러보기'}
        </a>
      </div>
    </EmailLayout>
  )
}

export function renderCoffeeChatResponseEmail(props: CoffeeChatResponseEmailProps): string {
  return renderEmail(<CoffeeChatResponseEmail {...props} />)
}
