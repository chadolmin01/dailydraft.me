/**
 * 월요일 09:00 KST — 운영진 채널 주간 리마인더
 *
 * 목적 (연구 권장: 주 1회 팀 요약 게시가 집단 효능감에 가장 효과적, Asia Pacific Ed Review 2025):
 *   - 지난 주 Ghostwriter 초안 제출·승인 현황을 월요일 아침에 다시 리마인드.
 *   - 일요일 밤 ghostwriter-generate가 이미 postDashboardSummary를 보내긴 하지만,
 *     월요일 아침 운영진이 한 주를 시작할 때 "지난 주 상태"를 다시 보여줘서
 *     의사결정 타이밍에 맞추기.
 *
 * vercel.json cron: "0 0 * * 1" (UTC 월 00:00 = KST 월 09:00)
 *
 * 동작:
 *   1. 운영진 채널이 설정된 클럽 (clubs.operator_channel_id IS NOT NULL) 조회
 *   2. 각 클럽에 대해 지난 7일 weekly_update_drafts 집계
 *   3. 운영진 채널에 요약 메시지 포스팅
 */

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withCronCapture } from '@/src/lib/posthog/with-cron-capture'
import { sendChannelMessage } from '@/src/lib/discord/client'

export const runtime = 'nodejs'
export const maxDuration = 120

export const POST = withCronCapture('ghostwriter-weekly-post', async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return ApiResponse.unauthorized()
  }

  const admin = createAdminClient()

  // 운영진 채널이 설정된 클럽만 대상
  const { data: clubs, error } = await admin
    .from('clubs')
    .select('id, name, operator_channel_id, slug')
    .not('operator_channel_id', 'is', null)

  if (error) {
    console.error('[weekly-post] 클럽 조회 실패:', error.message)
    return ApiResponse.internalError('클럽 조회 실패')
  }

  if (!clubs || clubs.length === 0) {
    return ApiResponse.ok({ success: true, message: '운영진 채널 설정된 클럽 없음', processed: 0 })
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://draft.app'

  const results = { processed: 0, posted: 0, errors: 0 }

  for (const club of clubs) {
    results.processed++

    try {
      // 지난 7일 초안 집계
      const { data: drafts } = await admin
        .from('weekly_update_drafts')
        .select('id, status, opportunity_id')
        .gte('created_at', sevenDaysAgo)
        .in(
          'opportunity_id',
          (
            await admin
              .from('opportunities')
              .select('id')
              .eq('club_id', club.id)
          ).data?.map((o) => o.id) ?? [],
        )

      const total = drafts?.length ?? 0
      const approved = drafts?.filter((d) => d.status === 'approved').length ?? 0
      const pending = drafts?.filter((d) => d.status === 'pending').length ?? 0
      const rejected = drafts?.filter((d) => d.status === 'rejected').length ?? 0

      const today = new Date().toLocaleDateString('ko-KR', {
        timeZone: 'Asia/Seoul',
        month: 'long',
        day: 'numeric',
      })

      const lines: string[] = [
        `📅 **${today} — 이번 주 시작합니다**`,
        '',
        `지난 주 ${club.name} 팀 주간 업데이트 현황입니다.`,
        '',
      ]

      if (total === 0) {
        lines.push('지난 주 생성된 팀 초안이 없습니다. 팀 채널 활동량을 확인해주세요.')
      } else {
        lines.push(`📝 총 ${total}개 초안 생성`)
        if (approved > 0) lines.push(`  ✅ 승인 ${approved}건`)
        if (pending > 0) lines.push(`  ⏳ 대기 ${pending}건 — 승인 요청`)
        if (rejected > 0) lines.push(`  ❌ 반려 ${rejected}건`)
      }

      lines.push('')
      lines.push(`🔗 ${appUrl}/clubs/${club.slug}/weekly-updates`)

      // operator_channel_id는 위 쿼리에서 is.not('null') 필터링됐지만
      // TS 추론이 이를 따라가지 못해 명시적 가드 필요
      if (!club.operator_channel_id) continue
      await sendChannelMessage(club.operator_channel_id, lines.join('\n'))
      results.posted++
    } catch (err) {
      console.error(`[weekly-post] 클럽 ${club.id} 처리 실패:`, err)
      results.errors++
    }
  }

  return ApiResponse.ok({ success: true, timestamp: new Date().toISOString(), ...results })
})

export async function GET() {
  return ApiResponse.ok({ status: 'ready', timestamp: new Date().toISOString() })
}
