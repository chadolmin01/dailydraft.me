/**
 * Publish Scheduled Cron
 *
 * 예약 시간이 지난 persona_outputs를 찾아 실제 발행.
 * 실행 주기: 5분마다 (Vercel cron).
 *
 * 발행 대상 조건:
 *   - scheduled_at <= now()
 *   - status IN ('approved', 'draft')
 *   - channel_format 별 발행 로직 분기 (Discord·LinkedIn)
 *   - 나머지 is_copy_only 채널은 scheduled_at이 있어도 자동 발행 불가 → skip (UI 알림만)
 *
 * 실패 처리:
 *   - 개별 output 실패는 다른 건 막지 않음
 *   - status='failed'로 마킹 + error_message 저장 (persona_outputs.destination 필드 재활용)
 */

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withCronCapture } from '@/src/lib/posthog/with-cron-capture'
import { sendChannelMessage } from '@/src/lib/discord/client'
import { publishToLinkedIn } from '@/src/lib/personas/publishers/linkedin'
import { runAutomationTick } from '@/src/lib/personas/automation-tick'
import { publishToThreads } from '@/src/lib/personas/publishers/threads'

export const runtime = 'nodejs'
export const maxDuration = 60

interface ScheduledOutput {
  id: string
  persona_id: string
  bundle_id: string | null
  channel_format: string
  generated_content: string
  scheduled_at: string
  status: string
  is_copy_only: boolean
}

export const POST = withCronCapture('publish-scheduled', async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return ApiResponse.unauthorized()
  }

  const admin = createAdminClient()
  const now = new Date().toISOString()

  // 1) 예약 시간이 지났고 아직 발행 안 된 것들 조회
  // 자동 생성 타입에 scheduled_at이 없어 any 캐스팅
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: outputs, error } = await (admin.from('persona_outputs') as any)
    .select('id, persona_id, bundle_id, channel_format, generated_content, scheduled_at, status, is_copy_only')
    .not('scheduled_at', 'is', null)
    .lte('scheduled_at', now)
    .in('status', ['approved', 'draft'])
    .limit(50) // 5분당 최대 50건

  if (error) {
    console.error('[publish-scheduled] 조회 실패:', error)
    return ApiResponse.internalError('조회 실패', error)
  }

  const targets = (outputs ?? []) as ScheduledOutput[]
  const results = { processed: 0, published: 0, failed: 0, skipped_copy_only: 0 }

  for (const output of targets) {
    results.processed++

    // is_copy_only 채널은 자동 발행 불가 — 복사 전용이라 사용자가 직접 올려야 함
    if (output.is_copy_only) {
      // scheduled_at을 null로 리셋해 다음 크론에서 다시 안 잡히게
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin.from('persona_outputs') as any)
        .update({ scheduled_at: null })
        .eq('id', output.id)
      results.skipped_copy_only++
      continue
    }

    try {
      let publishSuccess = false
      let destination: string | null = null
      let externalRef: string | null = null

      if (output.channel_format === 'discord_forum_markdown') {
        const channelId = await resolveDiscordChannelForScheduled(
          admin,
          output.persona_id,
          output.bundle_id,
        )
        if (channelId) {
          await sendChannelMessage(channelId, output.generated_content)
          publishSuccess = true
          destination = `discord:${channelId}`
        }
      } else if (output.channel_format === 'linkedin_post') {
        const res = await publishToLinkedIn(admin, {
          personaId: output.persona_id,
          content: output.generated_content,
        })
        publishSuccess = res.success
        destination = 'linkedin'
        externalRef = res.post_urn ?? null
      } else if (output.channel_format === 'threads_post') {
        const res = await publishToThreads(admin, {
          personaId: output.persona_id,
          content: output.generated_content,
        })
        publishSuccess = res.success
        destination = 'threads'
        externalRef = res.thread_id ?? null
      }
      // email_newsletter는 구독자 리스트 UI(R3.4+) 필요 — 지금은 skip

      if (publishSuccess) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin.from('persona_outputs') as any)
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
            destination,
            external_ref: externalRef,
            scheduled_at: null,
          })
          .eq('id', output.id)
        results.published++
      } else {
        results.failed++
        console.warn(
          `[publish-scheduled] ${output.channel_format} 발행 실패 (output ${output.id})`,
        )
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[publish-scheduled] 예외 (output ${output.id}):`, msg)
      results.failed++
    }
  }

  // Vercel cron 개수 한도 때문에 persona_automations tick 로직을 체이닝 실행.
  // 실패해도 publish-scheduled 결과는 반환.
  let automationResults: Awaited<ReturnType<typeof runAutomationTick>> | null = null
  try {
    automationResults = await runAutomationTick(admin)
  } catch (err) {
    console.error('[publish-scheduled] automation-tick 실패:', err)
  }

  return ApiResponse.ok({ ...results, automation: automationResults })
})

/**
 * 예약된 output의 bundle에서 Discord 대상 채널을 resolve.
 * bundle이 없으면(수동 생성된 단일 output) persona의 owner 클럽 operator_channel로 fallback.
 */
async function resolveDiscordChannelForScheduled(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  personaId: string,
  bundleId: string | null,
): Promise<string | null> {
  if (bundleId) {
    const { data: bundle } = await admin
      .from('persona_output_bundles')
      .select('event_metadata')
      .eq('id', bundleId)
      .maybeSingle()
    const meta = bundle?.event_metadata as
      | { discord_target_channel_id?: string; team_id?: string }
      | undefined
    if (meta?.discord_target_channel_id) return meta.discord_target_channel_id
    if (meta?.team_id) {
      const { data: tc } = await admin
        .from('discord_team_channels')
        .select('discord_channel_id')
        .eq('opportunity_id', meta.team_id)
        .maybeSingle()
      if (tc?.discord_channel_id) return tc.discord_channel_id
    }
  }

  // fallback: club operator channel
  const { data: persona } = await admin
    .from('personas')
    .select('type, owner_id')
    .eq('id', personaId)
    .maybeSingle()
  if (persona?.type !== 'club') return null

  const { data: club } = await admin
    .from('clubs')
    .select('operator_channel_id')
    .eq('id', persona.owner_id)
    .maybeSingle()
  return club?.operator_channel_id ?? null
}
