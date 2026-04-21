import { resend, FROM_EMAIL, isEmailEnabled } from './client'
import { APP_URL } from '@/src/constants'
import { renderWelcomeEmail } from './templates/welcome'

/**
 * Welcome email 발송.
 *
 * 호출 시점: 온보딩 완료 직후 1회. 중복 방송 방지 책임은 호출자 (이미 발송 여부
 * 를 profiles 에 플래그로 저장 후 확인).
 *
 * Resend 미설정이면 조용히 skip (로컬 개발 + 초기 스테이지 허용).
 */
export async function sendWelcomeEmail(params: {
  recipientEmail: string
  recipientName: string
  universityName?: string | null
  isVerifiedStudent?: boolean
}): Promise<{ success: boolean; error?: string }> {
  if (!isEmailEnabled() || !resend) {
    return { success: false, error: 'email_disabled' }
  }

  try {
    const html = renderWelcomeEmail({
      recipientName: params.recipientName,
      appUrl: APP_URL,
      isVerifiedStudent: params.isVerifiedStudent,
      universityName: params.universityName,
    })

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.recipientEmail,
      subject: `[Draft] ${params.recipientName}님, 동아리 운영을 Draft 에서 시작해보세요`,
      html,
    })

    if (error) {
      console.error('[send-welcome] resend error:', error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err) {
    console.error('[send-welcome] exception:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'unknown',
    }
  }
}
