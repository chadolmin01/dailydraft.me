import { resend, FROM_EMAIL, isEmailEnabled } from './client'

// FLIP 1기 AI 빌더 스터디 새 지원자 알림 이메일
// 폼 제출 시 운영자(RECRUIT_NOTIFICATION_EMAIL)에게 발송
// 실패해도 폼 제출 자체는 성공으로 처리 (best-effort)

export interface RecruitNotificationParams {
  name: string
  team_name: string
  team_role: 'leader' | 'member'

  ai_content_freq: 'rarely' | 'monthly' | 'weekly' | 'daily'
  ai_recent_use: string
  ai_build_attitude: 'no_interest' | 'interested_far' | 'want_start' | 'trying' | 'actively'
  willingness: number

  experience: string[]
  self_skill: number
  recent_build?: string

  paid_tools: string[]
  paid_tools_other?: string
  monthly_spend: '0' | 'lt1' | '1_3' | '3_6' | '6_10' | '10plus'
  claude_status: 'paid_want_subsidy' | 'paid_ok' | 'unpaid_self' | 'unpaid_want_subsidy' | 'unsure'

  team_asset_status: 'none' | 'idea' | 'wip' | 'has_url' | 'almost_done'
  desired_outcome: 'landing' | 'mvp_feature' | 'preorder_data' | 'experience' | 'founder_proof' | 'other'
  desired_outcome_other?: string
  ai_feature_idea?: string

  attendance: 'all_6' | '5' | 'lt_4' | 'unsure'
  available_slots: string[]
  has_laptop: boolean
  notes?: string
}

const ROLE_LABEL: Record<string, string> = {
  leader: '팀장',
  member: '팀원',
}

const AI_FREQ_LABEL: Record<string, string> = {
  rarely: '거의 안 봄',
  monthly: '월 1~2회',
  weekly: '주 몇 회',
  daily: '거의 매일',
}

const ATTITUDE_LABEL: Record<string, string> = {
  no_interest: '별로 관심 없음',
  interested_far: '관심은 있지만 멀게 느낌',
  want_start: '해보고 싶은데 어디서 시작할지 모름',
  trying: '이미 조금씩 시도 중',
  actively: '적극적으로 만들고 있음',
}

const EXPERIENCE_LABEL: Record<string, string> = {
  ai_regular: 'ChatGPT/Claude 정기 사용',
  ai_make_request: 'AI에게 결과물 요청 경험',
  ai_code: 'AI에게 코드 요청 경험',
  cursor: 'Cursor / Claude Code 사용',
  html_css: 'HTML/CSS 페이지 제작',
  github: 'GitHub 업로드',
  deploy: '웹사이트 배포 (Vercel 등)',
  db: 'DB 사용 (Supabase 등)',
  api: 'API 호출 코드',
  none: '해본 적 없음',
}

const PAID_TOOL_LABEL: Record<string, string> = {
  chatgpt: 'ChatGPT Plus/Pro',
  claude: 'Claude Pro/Max',
  cursor: 'Cursor Pro',
  perplexity: 'Perplexity Pro',
  nocode: '노코드 빌더 (v0/Bolt/Lovable)',
  gen_ai: '생성형 AI (Midjourney/Suno)',
  notion_ai: 'Notion AI',
  other: '기타',
  free_only: '무료만 사용',
  none: '아무것도 안 씀',
}

const SPEND_LABEL: Record<string, string> = {
  '0': '0원',
  lt1: '1만원 미만',
  '1_3': '1~3만원',
  '3_6': '3~6만원',
  '6_10': '6~10만원',
  '10plus': '10만원 이상',
}

const CLAUDE_STATUS_LABEL: Record<string, string> = {
  paid_want_subsidy: '이미 결제 중 (환급/보전 희망)',
  paid_ok: '이미 결제 중 (지원 없어도 OK)',
  unpaid_self: '미결제, 본인 비용으로 가능',
  unpaid_want_subsidy: '미결제, 지원되면 좋겠음',
  unsure: '잘 모르겠음',
}

const ASSET_LABEL: Record<string, string> = {
  none: '전혀 없음',
  idea: '아이디어/기획만 있음',
  wip: '일부 작업 중 (노션·Figma 등)',
  has_url: '어느 정도 만들어져 있음 (URL 있음)',
  almost_done: '거의 완성 단계',
}

const OUTCOME_LABEL: Record<string, string> = {
  landing: '데모데이용 랜딩페이지/사이트',
  mvp_feature: 'MVP 일부 기능',
  preorder_data: '사전예약/유저 데이터 수집 도구',
  experience: 'AI로 만드는 과정 경험',
  founder_proof: '"내 손으로 만들어봤다" 경험',
  other: '기타',
}

const ATTENDANCE_LABEL: Record<string, string> = {
  all_6: '6회 다 가능',
  '5': '5회 정도 가능',
  lt_4: '4회 이하',
  unsure: '잘 모르겠음',
}

const SLOT_LABEL: Record<string, string> = {
  weekday_7_9: '평일 저녁 7~9시',
  weekday_8_10: '평일 저녁 8~10시',
  sat_am: '토요일 오전',
  sat_pm: '토요일 오후',
  sun_am: '일요일 오전',
  sun_pm: '일요일 오후',
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function labelList(ids: string[], map: Record<string, string>, fallback = '(없음)') {
  if (!ids?.length) return fallback
  return ids.map((id) => map[id] ?? id).join(', ')
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

  const experienceStr = labelList(data.experience, EXPERIENCE_LABEL)
  const paidToolsStr = labelList(data.paid_tools, PAID_TOOL_LABEL)
  const slotsStr = labelList(data.available_slots, SLOT_LABEL)

  const optionalRow = (label: string, value?: string) =>
    value && value.trim()
      ? `<div style="margin-top: 16px;"><div style="font-size: 12px; color: #888; margin-bottom: 6px;">${label}</div><div style="background: #f6f6f6; padding: 12px 14px; border-radius: 8px; font-size: 14px; white-space: pre-wrap;">${escapeHtml(value)}</div></div>`
      : ''

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>FLIP 1기 새 지원자</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; color: #1a1a1a; line-height: 1.6;">
  <div style="border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; margin-bottom: 24px;">
    <div style="font-size: 12px; color: #888; letter-spacing: 0.5px;">FLIP × DRAFT · 1기 AI 빌더 스터디</div>
    <h1 style="margin: 8px 0 0; font-size: 22px;">새 지원자: ${escapeHtml(data.name)} <span style="font-size: 14px; color: #888;">(${escapeHtml(data.team_name)} · ${ROLE_LABEL[data.team_role] || data.team_role})</span></h1>
  </div>

  <h2 style="font-size: 14px; color: #888; margin: 0 0 8px; font-weight: 600;">기본 정보</h2>
  <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
    <tr><td style="padding: 6px 0; color: #888; width: 140px;">이름</td><td style="padding: 6px 0; font-weight: 600;">${escapeHtml(data.name)}</td></tr>
    <tr><td style="padding: 6px 0; color: #888;">소속 팀</td><td style="padding: 6px 0;">${escapeHtml(data.team_name)}</td></tr>
    <tr><td style="padding: 6px 0; color: #888;">팀 내 역할</td><td style="padding: 6px 0;">${ROLE_LABEL[data.team_role] || data.team_role}</td></tr>
  </table>

  <h2 style="font-size: 14px; color: #888; margin: 0 0 8px; font-weight: 600;">AI 관심·태도</h2>
  <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
    <tr><td style="padding: 6px 0; color: #888; width: 140px;">AI 콘텐츠 시청</td><td style="padding: 6px 0;">${AI_FREQ_LABEL[data.ai_content_freq] || data.ai_content_freq}</td></tr>
    <tr><td style="padding: 6px 0; color: #888;">AI로 만들기 태도</td><td style="padding: 6px 0;">${ATTITUDE_LABEL[data.ai_build_attitude] || data.ai_build_attitude}</td></tr>
    <tr><td style="padding: 6px 0; color: #888;">의지 (1~5)</td><td style="padding: 6px 0;">${data.willingness}점</td></tr>
  </table>
  ${optionalRow('최근 한 달 AI 사용 용도', data.ai_recent_use)}

  <h2 style="font-size: 14px; color: #888; margin: 24px 0 8px; font-weight: 600;">AI/개발 경험</h2>
  <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 12px;">
    <tr><td style="padding: 6px 0; color: #888; width: 140px;">자가평가 (1~5)</td><td style="padding: 6px 0;">${data.self_skill}점</td></tr>
    <tr><td style="padding: 6px 0; color: #888; vertical-align: top;">경험</td><td style="padding: 6px 0;">${escapeHtml(experienceStr)}</td></tr>
  </table>
  ${optionalRow('최근 만든 것', data.recent_build)}

  <h2 style="font-size: 14px; color: #888; margin: 24px 0 8px; font-weight: 600;">AI 도구 사용 & 비용</h2>
  <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 12px;">
    <tr><td style="padding: 6px 0; color: #888; width: 140px; vertical-align: top;">결제 도구</td><td style="padding: 6px 0;">${escapeHtml(paidToolsStr)}${data.paid_tools_other ? ` <span style="color:#888;">(기타: ${escapeHtml(data.paid_tools_other)})</span>` : ''}</td></tr>
    <tr><td style="padding: 6px 0; color: #888;">월 평균 지출</td><td style="padding: 6px 0;">${SPEND_LABEL[data.monthly_spend] || data.monthly_spend}</td></tr>
    <tr><td style="padding: 6px 0; color: #888;">Claude Pro 상황</td><td style="padding: 6px 0; font-weight: 600;">${CLAUDE_STATUS_LABEL[data.claude_status] || data.claude_status}</td></tr>
  </table>

  <h2 style="font-size: 14px; color: #888; margin: 24px 0 8px; font-weight: 600;">팀 자산 & 목표</h2>
  <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 12px;">
    <tr><td style="padding: 6px 0; color: #888; width: 140px;">팀 자산 상태</td><td style="padding: 6px 0;">${ASSET_LABEL[data.team_asset_status] || data.team_asset_status}</td></tr>
    <tr><td style="padding: 6px 0; color: #888;">6주 후 얻고 싶은 것</td><td style="padding: 6px 0;">${OUTCOME_LABEL[data.desired_outcome] || data.desired_outcome}${data.desired_outcome_other ? ` <span style="color:#888;">(${escapeHtml(data.desired_outcome_other)})</span>` : ''}</td></tr>
  </table>
  ${optionalRow('AI 기능 아이디어', data.ai_feature_idea)}

  <h2 style="font-size: 14px; color: #888; margin: 24px 0 8px; font-weight: 600;">운영</h2>
  <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 12px;">
    <tr><td style="padding: 6px 0; color: #888; width: 140px;">참여 가능 횟수</td><td style="padding: 6px 0;">${ATTENDANCE_LABEL[data.attendance] || data.attendance}</td></tr>
    <tr><td style="padding: 6px 0; color: #888; vertical-align: top;">가능 시간대</td><td style="padding: 6px 0;">${escapeHtml(slotsStr)}</td></tr>
    <tr><td style="padding: 6px 0; color: #888;">노트북 지참</td><td style="padding: 6px 0;">${data.has_laptop ? '네' : '아니요'}</td></tr>
  </table>
  ${optionalRow('운영에 하고 싶은 말', data.notes)}

  <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
    Supabase Studio · flip_1_applications 테이블에서 전체 목록을 확인할 수 있습니다.
  </div>
</body>
</html>
`.trim()

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipient,
      subject: `[FLIP 1기] 새 지원자: ${data.name} (${data.team_name} · ${ROLE_LABEL[data.team_role] || data.team_role})`,
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
