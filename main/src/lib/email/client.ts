import { Resend } from 'resend'

// Resend 클라이언트 초기화
const resendApiKey = process.env.RESEND_API_KEY

// Email sending is disabled if RESEND_API_KEY is not configured

export const resend = resendApiKey ? new Resend(resendApiKey) : null

// 발신자 이메일 (Resend 도메인 설정 후 변경)
export const FROM_EMAIL = process.env.EMAIL_FROM || 'DailyDraft <onboarding@resend.dev>'

// 이메일 전송 가능 여부 확인
export function isEmailEnabled(): boolean {
  return !!resend
}
