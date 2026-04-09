import * as React from 'react'
import { EmailLayout, emailStyles, renderEmail } from './_layout'

interface InstitutionAnnounceEmailProps {
  recipientName: string
  institutionName: string
  subject: string
  body: string
  appUrl: string
}

export function InstitutionAnnounceEmail({
  recipientName,
  institutionName,
  subject,
  body,
  appUrl,
}: InstitutionAnnounceEmailProps) {
  return (
    <EmailLayout eyebrow={`${institutionName} 공지`}>
      <h1 style={emailStyles.heading}>{subject}</h1>
      <p style={{ ...emailStyles.text, marginBottom: '8px' }}>{recipientName}님,</p>
      <p style={{ ...emailStyles.text, whiteSpace: 'pre-wrap' }}>{body}</p>

      <div style={emailStyles.ctaWrap}>
        <a href={appUrl} style={emailStyles.cta}>
          Draft 열기
        </a>
      </div>
    </EmailLayout>
  )
}

export function renderInstitutionAnnounceEmail(props: InstitutionAnnounceEmailProps): string {
  return renderEmail(<InstitutionAnnounceEmail {...props} />)
}
