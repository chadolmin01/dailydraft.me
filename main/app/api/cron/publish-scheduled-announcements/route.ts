/**
 * GET /api/cron/publish-scheduled-announcements — 예약된 공지 발행
 *
 * Vercel Cron 또는 외부 스케줄러에서 호출.
 * scheduled_at <= now() AND published_at IS NULL 인 것 발행 처리:
 *   - published_at = now()
 *   - 등록된 Discord/Slack 웹훅으로 전파
 *
 * Authorization: Bearer {CRON_SECRET}
 */

import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

export const runtime = 'nodejs'
export const maxDuration = 60

export const GET = withErrorCapture(async (request) => {
  const auth = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return ApiResponse.unauthorized('Invalid cron secret')
  }

  const admin = createAdminClient()
  const now = new Date().toISOString()

  // 예약 시각이 지났지만 아직 발행 안 된 공지
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pending = [], error } = await (admin as any)
    .from('club_announcements')
    .select('id, club_id, title, content')
    .lte('scheduled_at', now)
    .is('published_at', null)
    .limit(50)

  if (error) return ApiResponse.internalError(error.message)
  if (!pending || pending.length === 0) {
    return ApiResponse.ok({ published: 0 })
  }

  let published = 0
  for (const a of pending as Array<{ id: string; club_id: string; title: string; content: string }>) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any)
        .from('club_announcements')
        .update({ published_at: now })
        .eq('id', a.id)

      // 웹훅 전파
      const { data: channels = [] } = await admin
        .from('club_notification_channels')
        .select('webhook_url, channel_type')
        .eq('club_id', a.club_id)
        .contains('event_types', ['announcement'])

      for (const ch of channels ?? []) {
        const payload = ch.channel_type === 'discord_webhook'
          ? {
              embeds: [{
                title: `📢 ${a.title}`,
                description: a.content.slice(0, 2000),
                color: 0x6366f1,
                footer: { text: 'Draft 공지 (예약 발송)' },
                timestamp: now,
              }],
            }
          : { text: `📢 *${a.title}*\n${a.content.slice(0, 2000)}` }

        try {
          await fetch(ch.webhook_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(5000),
          })
        } catch {
          // fire-and-forget
        }
      }

      published += 1
    } catch (e) {
      console.warn('[publish-scheduled-announcements] fail', a.id, e)
    }
  }

  return ApiResponse.ok({ published })
})
