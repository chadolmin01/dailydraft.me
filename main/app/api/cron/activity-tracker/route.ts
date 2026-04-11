/**
 * 개인별 활동도 트래커 — 매주 일요일 21:00 KST (ghostwriter 1시간 전)
 *
 * 각 팀 채널의 1주일치 메시지에서 author별 메시지 수를 집계하여
 * member_activity_stats에 저장한다.
 *
 * 이 데이터를 기반으로:
 * - 운영진이 개인별 참여도를 파악
 * - 연속 미활동 감지 (P2 에스컬레이션)
 * - 체크인 미제출 추적
 *
 * Vercel Cron: "0 12 * * 0" (일요일 12:00 UTC = 21:00 KST)
 */

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withCronCapture } from '@/src/lib/posthog/with-cron-capture'
import { fetchChannelMessages } from '@/src/lib/discord/client'
import { getISOWeekNumber } from '@/src/lib/ghostwriter/week-utils'

export const runtime = 'nodejs'
export const maxDuration = 120

export const POST = withCronCapture('activity-tracker', async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return ApiResponse.unauthorized()
  }

  const admin = createAdminClient()
  const now = new Date()
  const weekNumber = getISOWeekNumber(now)
  const year = now.getFullYear()

  // 1. 매핑된 모든 Discord 채널 조회
  const { data: channels } = await admin
    .from('discord_team_channels')
    .select('club_id, discord_channel_id, last_fetched_message_id')

  if (!channels || channels.length === 0) {
    return ApiResponse.ok({ success: true, message: '매핑된 채널 없음', tracked: 0 })
  }

  // 클럽별 활동 집계
  const clubActivity = new Map<string, Map<string, { username: string; count: number; channels: Set<string> }>>()

  for (const ch of channels) {
    try {
      const messages = await fetchChannelMessages(ch.discord_channel_id, {
        after: ch.last_fetched_message_id || undefined,
        maxMessages: 500,
      })

      // author별 집계
      for (const msg of messages) {
        if (!msg.content.trim()) continue

        if (!clubActivity.has(ch.club_id)) {
          clubActivity.set(ch.club_id, new Map())
        }
        const members = clubActivity.get(ch.club_id)!

        const authorId = msg.author.id
        const existing = members.get(authorId) || {
          username: msg.author.global_name || msg.author.username,
          count: 0,
          channels: new Set<string>(),
        }
        existing.count++
        existing.channels.add(ch.discord_channel_id)
        members.set(authorId, existing)
      }
    } catch (error) {
      console.error('[activity-tracker] 채널 처리 실패', {
        channelId: ch.discord_channel_id,
        error,
      })
    }
  }

  // 2. DB에 upsert
  let tracked = 0

  for (const [clubId, members] of clubActivity) {
    for (const [discordUserId, data] of members) {
      const { error } = await admin
        .from('member_activity_stats')
        .upsert(
          {
            club_id: clubId,
            discord_user_id: discordUserId,
            discord_username: data.username,
            week_number: weekNumber,
            year,
            message_count: data.count,
            channels_active: data.channels.size,
          },
          { onConflict: 'club_id,discord_user_id,week_number,year' }
        )

      if (!error) tracked++
    }
  }

  return ApiResponse.ok({
    success: true,
    week_number: weekNumber,
    clubs_processed: clubActivity.size,
    members_tracked: tracked,
  })
})

export async function GET() {
  return ApiResponse.ok({ status: 'ready', timestamp: new Date().toISOString() })
}

