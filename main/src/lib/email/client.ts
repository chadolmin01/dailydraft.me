import { Resend } from 'resend'
import { renderInviteCodeEmail } from './templates/invite-code'

// Resend 클라이언트 초기화
const resendApiKey = process.env.RESEND_API_KEY

// Email sending is disabled if RESEND_API_KEY is not configured

export const resend = resendApiKey ? new Resend(resendApiKey) : null

// 발신자 이메일 (Resend 도메인 설정 후 변경)
export const FROM_EMAIL = process.env.EMAIL_FROM || 'DailyDraft <onboarding@resend.dev>'

// 앱 URL
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://dailydraft.me'

// 이메일 전송 가능 여부 확인
export function isEmailEnabled(): boolean {
  return !!resend
}

// 초대 코드 이메일 발송
export async function sendInviteCodeEmail({
  recipientEmail,
  recipientName,
  inviteCode,
  expiresAt,
}: {
  recipientEmail: string
  recipientName: string
  inviteCode: string
  expiresAt: string
}): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('Email sending is disabled: RESEND_API_KEY not configured')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const html = renderInviteCodeEmail({
      recipientName,
      inviteCode,
      expiresAt,
      appUrl: APP_URL,
    })

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `[DailyDraft] 프리미엄 초대 코드: ${inviteCode}`,
      html,
    })

    if (error) {
      console.error('Failed to send invite code email:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to send invite code email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
