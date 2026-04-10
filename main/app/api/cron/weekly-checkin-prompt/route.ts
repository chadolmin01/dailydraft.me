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
import { createForumThread } from '@/src/lib/discord/client'

export const runtime = 'nodejs'

export const POST = withCronCapture('weekly-checkin-prompt', async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return ApiResponse.unauthorized()
  }

  // 체크인 포럼 채널 ID (Bot API 직접 접근 — webhook이 아닌 포럼이므로 환경변수로 지정)
  const checkinChannelId = process.env.DISCORD_CHECKIN_FORUM_CHANNEL_ID
  if (!checkinChannelId) {
    return ApiResponse.ok({
      success: true,
      message: 'DISCORD_CHECKIN_FORUM_CHANNEL_ID 환경변수가 설정되지 않았습니다',
      threadsCreated: 0,
    })
  }

  // 이번 주 월요일 날짜 계산
  const now = new Date()
  const weekNumber = getISOWeekNumber(now)
  const mondayDate = now.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  })

  let threadsCreated = 0

  try {
    const threadName = `${mondayDate} 주간 체크인 (${weekNumber}주차)`
    const threadContent = `**${weekNumber}주차 주간 체크인** 📋

아래 양식에 맞춰 이번 주 상황을 공유해주세요.
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

📊 **기획/비즈니스**
\`\`\`
✅ 이번 주 할 일: 교내 창업팀 3곳 인터뷰 정리, 경쟁사 비교표
🔧 진행 중: 린캔버스 고객 세그먼트 섹션 작성
🚧 블로커: 인터뷰 대상자 1명 일정 미정
\`\`\``

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
  })
})

export async function GET() {
  return ApiResponse.ok({ status: 'ready', timestamp: new Date().toISOString() })
}

function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}
