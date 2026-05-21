/**
 * 주간 체크인 자동 프롬프트 — 매주 월요일 오전 실행
 *
 * #주간-체크인 포럼 채널에 이번 주 스레드를 자동 생성한다.
 * 멱등: 같은 주차에 이미 스레드가 있으면 스킵.
 *
 * Vercel Cron 설정: 매주 월요일 09:00 KST (일요일 24:00 UTC)
 * cron: "0 0 * * 1"
 */

import { NextRequest } from 'next/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withCronCapture } from '@/src/lib/posthog/with-cron-capture'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { createForumThread } from '@/src/lib/discord/client'
import { getISOWeekNumber } from '@/src/lib/ghostwriter/week-utils'

export const runtime = 'nodejs'

/** 시스템 기본 체크인 템플릿 */
const DEFAULT_TEMPLATE = `아래 양식에 맞춰 이번 주 상황을 공유해주세요.
양식에 맞춰야 AI가 정확하게 주간 업데이트를 작성할 수 있습니다.

━━━━━━━━━━━━━━━━━━━━

\`\`\`
✅ 이번 주 할 일:

🔧 진행 중:

🚧 블로커:
\`\`\`

━━━━━━━━━━━━━━━━━━━━

💡 자유롭게 적어도 되지만, 이모지 태그(✅🔧🚧)를 사용하면 AI 요약이 더 정확해집니다.
금요일까지 작성해주세요. 일요일에 AI가 주간 업데이트 초안을 생성합니다.

━━━━━━━━━━━━━━━━━━━━

**역할별 예시**

💻 **개발**
\`\`\`
✅ 이번 주 할 일: 로그인 API 연동, 회원가입 폼 구현
🔧 진행 중: Figma 디자인 기반 메인 페이지 퍼블리싱
🚧 블로커: 백엔드 API 문서 미완성
\`\`\`

🎨 **디자인**
\`\`\`
✅ 이번 주 할 일: 메인 페이지 시안 v2, 컴포넌트 정리
🔧 진행 중: 온보딩 플로우 와이어프레임
🚧 블로커: 기획 확정 대기 중
\`\`\`
💡 Figma 링크나 스크린샷도 함께 올려주세요! AI가 파일명을 보고 작업 내역을 더 정확히 파악합니다.

📊 **기획/비즈니스**
\`\`\`
✅ 이번 주 할 일: 교내 창업팀 3곳 인터뷰 정리, 경쟁사 비교표
🔧 진행 중: 린캔버스 고객 세그먼트 섹션 작성
🚧 블로커: 인터뷰 대상자 1명 일정 미정
\`\`\``

export const POST = withCronCapture('weekly-checkin-prompt', async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return ApiResponse.unauthorized()
  }

  const now = new Date()
  const todayDow = now.getDay() // 0=일, 1=월, ...
  const weekNumber = getISOWeekNumber(now)

  const admin = createAdminClient()

  // 체크인 포럼 채널 ID (현재 단일 — 향후 클럽별 분리 가능)
  const checkinChannelId = process.env.DISCORD_CHECKIN_FORUM_CHANNEL_ID
  if (!checkinChannelId) {
    return ApiResponse.ok({
      success: true,
      message: 'DISCORD_CHECKIN_FORUM_CHANNEL_ID 환경변수가 설정되지 않았습니다',
      threadsCreated: 0,
    })
  }

  // 클럽별 설정 조회 — checkin_day가 오늘과 맞는 클럽만 처리
  // 설정이 없는 클럽은 기본값(1=월요일)로 간주
  const { data: allSettings } = await admin
    .from('club_ghostwriter_settings')
    .select('club_id, checkin_day, checkin_template')

  // 오늘이 체크인 날인 클럽 식별
  // 설정이 없는 클럽도 있으므로: 설정이 없으면 월요일(1)이 기본
  const settingsMap = new Map<string, { checkin_day: number; checkin_template: string | null }>()
  for (const s of (allSettings || [])) {
    settingsMap.set(s.club_id, s)
  }

  // 매핑된 클럽 목록 (discord_team_channels에 등록된 클럽)
  const { data: channels } = await admin
    .from('discord_team_channels')
    .select('club_id')

  const activeClubIds = [...new Set((channels || []).map((c: { club_id: string }) => c.club_id))]

  // 오늘이 체크인 날인 클럽 필터링
  const clubsToProcess = activeClubIds.filter(clubId => {
    const s = settingsMap.get(clubId)
    const checkinDay = s?.checkin_day ?? 1 // 기본 월요일
    return checkinDay === todayDow
  })

  if (clubsToProcess.length === 0) {
    return ApiResponse.ok({
      success: true,
      message: `오늘(${todayDow})은 체크인 날이 아닌 클럽만 있습니다`,
      threadsCreated: 0,
    })
  }

  // 체크인 스레드 생성 (현재는 단일 포럼 채널이므로 1개만 생성)
  // 커스텀 템플릿이 있는 클럽이 있으면 해당 템플릿 사용
  const firstClubSettings = settingsMap.get(clubsToProcess[0])
  const template = firstClubSettings?.checkin_template || DEFAULT_TEMPLATE

  const dateStr = now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
  let threadsCreated = 0

  try {
    const threadName = `${dateStr} 주간 체크인 (${weekNumber}주차)`
    const threadContent = `**${weekNumber}주차 주간 체크인** 📋\n\n${template}`

    await createForumThread(checkinChannelId, threadName, threadContent)
    threadsCreated++
  } catch (err) {
    console.error('[weekly-checkin] 스레드 생성 실패', {
      channelId: checkinChannelId,
      error: err,
    })
  }

  return ApiResponse.ok({
    success: true,
    weekNumber,
    threadsCreated,
    clubsProcessed: clubsToProcess.length,
  })
})

export async function GET() {
  return ApiResponse.ok({ status: 'ready', timestamp: new Date().toISOString() })
}
