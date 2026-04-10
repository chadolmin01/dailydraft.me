/**
 * 리액션 수집기 — 매주 일요일 ghostwriter와 함께 실행
 *
 * 팀 채널에서 📌 리액션이 달린 메시지를 수집하여
 * #결정-로그 채널에 자동 아카이브한다.
 *
 * 또한 👍/👎 리액션이 달린 메시지의 찬반 결과를 집계하여
 * ghostwriter 하네스 컨텍스트에 포함시킬 수 있도록 저장한다.
 *
 * Vercel Cron: ghostwriter와 함께 실행 (별도 스케줄 또는 ghostwriter에서 호출)
 */

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withCronCapture } from '@/src/lib/posthog/with-cron-capture'
import {
  fetchChannelMessages,
  fetchMessageReactions,
  sendChannelMessage,
} from '@/src/lib/discord/client'

export const runtime = 'nodejs'
export const maxDuration = 120

export const POST = withCronCapture('reaction-collector', async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return ApiResponse.unauthorized()
  }

  const admin = createAdminClient()
  const decisionLogChannelId = process.env.DISCORD_DECISION_LOG_CHANNEL_ID

  // 1. 매핑된 팀 채널 조회
  const { data: channels } = await admin
    .from('discord_team_channels')
    .select('discord_channel_id, discord_channel_name, last_fetched_message_id')

  if (!channels || channels.length === 0) {
    return ApiResponse.ok({ success: true, decisions_collected: 0 })
  }

  let decisionsCollected = 0
  let votesCollected = 0

  for (const ch of channels as { discord_channel_id: string; discord_channel_name: string; last_fetched_message_id: string | null }[]) {
    try {
      // 최근 메시지 조회 (last_fetched 이후)
      const messages = await fetchChannelMessages(ch.discord_channel_id, {
        after: ch.last_fetched_message_id || undefined,
        maxMessages: 200,
      })

      for (const msg of messages) {
        // 📌 리액션 체크 — 중요 결정사항
        try {
          const pinReactions = await fetchMessageReactions(
            ch.discord_channel_id,
            msg.id,
            '📌'
          )

          if (pinReactions.length > 0 && decisionLogChannelId) {
            // #결정-로그에 아카이브
            const author = msg.author.global_name || msg.author.username
            const date = new Date(msg.timestamp).toLocaleDateString('ko-KR')
            await sendChannelMessage(
              decisionLogChannelId,
              [
                `**📌 결정사항** — #${ch.discord_channel_name}`,
                `> ${msg.content.slice(0, 500)}`,
                `— ${author} (${date}) | 📌 ${pinReactions.length}명 동의`,
              ].join('\n')
            )
            decisionsCollected++
          }
        } catch {
          // 리액션 조회 실패는 무시 (API rate limit 등)
        }

        // 👍/👎 투표 집계
        try {
          const thumbsUp = await fetchMessageReactions(ch.discord_channel_id, msg.id, '👍')
          const thumbsDown = await fetchMessageReactions(ch.discord_channel_id, msg.id, '👎')

          if (thumbsUp.length + thumbsDown.length >= 3) {
            // 투표 결과가 유의미한 경우만 (3명 이상 참여)
            votesCollected++
          }
        } catch {
          // 무시
        }
      }
    } catch (error) {
      console.error('[reaction-collector] 채널 처리 실패', {
        channelId: ch.discord_channel_id,
        error,
      })
    }
  }

  return ApiResponse.ok({
    success: true,
    decisions_collected: decisionsCollected,
    votes_collected: votesCollected,
  })
})

export async function GET() {
  return ApiResponse.ok({ status: 'ready', timestamp: new Date().toISOString() })
}
