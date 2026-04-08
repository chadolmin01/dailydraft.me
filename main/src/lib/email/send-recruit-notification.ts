import { resend, FROM_EMAIL, isEmailEnabled } from './client'

// Draft 1기 새 지원자 알림 이메일
// 폼 제출 시 운영자(RECRUIT_NOTIFICATION_EMAIL)에게 발송
// 실패해도 폼 제출 자체는 성공으로 처리 (best-effort)

interface RecruitNotificationParams {
  name: string
  team_idea: string
  team_role: string
  ai_experience: string
  learning_goal: string
  motivation: string
  available_slots: string[]
  weekly_hours: string
  offline_available: string
}

const ROLE_LABEL: Record<string, string> = {
  plan: '기획',
  design: '디자인',
  dev: '개발',
  etc: '기타',
}

const HOURS_LABEL: Record<string, string> = {
  '3-5': '주 3~5시간',
  '5-8': '주 5~8시간 (권장)',
  '8+': '주 8시간 이상',
}

const OFFLINE_LABEL: Record<string, string> = {
  yes: '3회 모두 참여 가능',
  discuss: '협의 필요',
}

const SLOT_LABEL: Record<string, string> = {
  mon_eve: '월 저녁',
  tue_eve: '화 저녁',
  wed_eve: '수 저녁',
  thu_eve: '목 저녁',
  fri_eve: '금 저녁',
  sat_am: '토 오전',
  sat_pm: '토 오후',
  sun_am: '일 오전',
  sun_pm: '일 오후',
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function sendRecruitNotification(
  data: RecruitNotificationParams
): Promise<{ success: boolean; error?: string }> {
  const recipient = process.env.RECRUIT_NOTIFICATION_EMAIL
  if (!recipient) {
    console.warn('RECRUIT_NOTIFICATION_EMAIL not configured — skipping recruit notification')
    return { success: false, error: 'recipient not configured' }
  }
  if (!isEmailEnabled() || !resend) {
    console.warn('Resend not configured — skipping recruit notification')
    return { success: false, error: 'resend not configured' }
  }

  const slotsStr =
    data.available_slots.map((s) => SLOT_LABEL[s] || s).join(', ') || '(없음)'

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>새 1기 지원자</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; line-height: 1.6;">
  <div style="border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; margin-bottom: 24px;">
    <div style="font-size: 12px; color: #888; letter-spacing: 0.5px;">DRAFT × FLIP · 1기 모집</div>
    <h1 style="margin: 8px 0 0; font-size: 22px;">새 지원자: ${escapeHtml(data.name)}</h1>
  </div>

  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
    <tr><td style="padding: 8px 0; color: #888; width: 120px;">이름</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(data.name)}</td></tr>
    <tr><td style="padding: 8px 0; color: #888;">팀 아이디어</td><td style="padding: 8px 0;">${escapeHtml(data.team_idea)}</td></tr>
    <tr><td style="padding: 8px 0; color: #888;">팀 내 역할</td><td style="padding: 8px 0;">${ROLE_LABEL[data.team_role] || data.team_role}</td></tr>
    <tr><td style="padding: 8px 0; color: #888;">주당 시간</td><td style="padding: 8px 0;">${HOURS_LABEL[data.weekly_hours] || data.weekly_hours}</td></tr>
    <tr><td style="padding: 8px 0; color: #888;">오프라인</td><td style="padding: 8px 0;">${OFFLINE_LABEL[data.offline_available] || data.offline_available}</td></tr>
    <tr><td style="padding: 8px 0; color: #888;">가능 시간대</td><td style="padding: 8px 0;">${escapeHtml(slotsStr)}</td></tr>
  </table>

  <div style="margin-top: 24px;">
    <div style="font-size: 12px; color: #888; margin-bottom: 6px;">AI 활용 경험</div>
    <div style="background: #f6f6f6; padding: 12px 14px; border-radius: 8px; font-size: 14px; white-space: pre-wrap;">${escapeHtml(data.ai_experience)}</div>
  </div>

  <div style="margin-top: 16px;">
    <div style="font-size: 12px; color: #888; margin-bottom: 6px;">8주 동안 경험하고 싶은 것</div>
    <div style="background: #f6f6f6; padding: 12px 14px; border-radius: 8px; font-size: 14px; white-space: pre-wrap;">${escapeHtml(data.learning_goal)}</div>
  </div>

  <div style="margin-top: 16px;">
    <div style="font-size: 12px; color: #888; margin-bottom: 6px;">지원 동기</div>
    <div style="background: #f6f6f6; padding: 12px 14px; border-radius: 8px; font-size: 14px; white-space: pre-wrap;">${escapeHtml(data.motivation)}</div>
  </div>

  <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
    Supabase Studio에서 전체 목록을 확인할 수 있습니다.
  </div>
</body>
</html>
`.trim()

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipient,
      subject: `[Draft 1기] 새 지원자: ${data.name} (${ROLE_LABEL[data.team_role] || data.team_role})`,
      html,
    })

    if (error) {
      console.error('Failed to send recruit notification email:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to send recruit notification email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
