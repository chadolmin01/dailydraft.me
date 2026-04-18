/**
 * Persona Automations Tick Cron
 *
 * 5~15분 주기로 실행. next_run_at <= now() AND active=true 인 자동화들을 픽업해:
 *   1) createBundle 호출 (daily_count만큼 반복, R3.3 에선 1개만)
 *   2) auto_publish=true면 approveBundle까지 호출 → 즉시 발행 플로우
 *   3) next_run_at을 주기에 맞춰 다음 시점으로 민다
 *   4) last_run_at, last_run_status 기록
 *
 * 실패는 개별 자동화마다 격리 — 하나 실패해도 다른 건 진행.
 * 중복 실행 방지: 처리 직전 next_run_at을 즉시 미뤄버려 race 최소화.
 */

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withCronCapture } from '@/src/lib/posthog/with-cron-capture'
import {
  createBundle,
  approveBundle,
} from '@/src/lib/personas/bundles'
import {
  computeNextRunAt,
  type Frequency,
} from '@/src/lib/personas/automation-schedule'
import type { EventType } from '@/src/lib/personas/types'

export const runtime = 'nodejs'
export const maxDuration = 120

interface AutomationRow {
  id: string
  persona_id: string
  event_type: string
  frequency: Frequency
  run_hour: number
  run_minute: number
  run_weekday: number | null
  run_day_of_month: number | null
  daily_count: number
  auto_publish: boolean
  default_metadata: Record<string, unknown>
  active: boolean
  created_by: string | null
}

export const POST = withCronCapture(
  'persona-automations-tick',
  async (request: NextRequest) => {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return ApiResponse.unauthorized()
    }

    const admin = createAdminClient()
    const now = new Date()
    const nowIso = now.toISOString()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rows, error } = await (admin.from('persona_automations') as any)
      .select(
        'id, persona_id, event_type, frequency, run_hour, run_minute, run_weekday, run_day_of_month, daily_count, auto_publish, default_metadata, active, created_by',
      )
      .eq('active', true)
      .lte('next_run_at', nowIso)
      .limit(50)

    if (error) {
      console.error('[automation-tick] 조회 실패:', error)
      return ApiResponse.internalError('조회 실패', error)
    }

    const targets = (rows ?? []) as AutomationRow[]
    const results = { processed: 0, generated: 0, published: 0, failed: 0 }

    for (const row of targets) {
      results.processed++

      // 1) next_run_at을 먼저 미뤄 중복 실행 방지
      const nextRunAt = computeNextRunAt(
        {
          frequency: row.frequency,
          run_hour: row.run_hour,
          run_minute: row.run_minute,
          run_weekday: row.run_weekday,
          run_day_of_month: row.run_day_of_month,
        },
        now,
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin.from('persona_automations') as any)
        .update({ next_run_at: nextRunAt, last_run_at: nowIso })
        .eq('id', row.id)

      // 2) daily_count 만큼 번들 생성
      let ok = 0
      let fail = 0
      for (let i = 0; i < Math.max(1, row.daily_count); i++) {
        try {
          const result = await createBundle(admin, {
            personaId: row.persona_id,
            eventType: row.event_type as EventType,
            eventMetadata: {
              ...row.default_metadata,
              _auto: true,
              _automation_id: row.id,
            },
            userId: row.created_by,
            notifyOperator: true,
          })
          results.generated++
          ok++

          // 3) auto_publish이면 즉시 승인 = 자동 발행
          if (row.auto_publish && row.created_by) {
            try {
              await approveBundle(admin, result.bundle.id, row.created_by)
              results.published++
            } catch (pubErr) {
              console.warn(
                `[automation-tick] 자동 발행 실패 (automation ${row.id}):`,
                (pubErr as Error).message,
              )
            }
          }
        } catch (err) {
          fail++
          results.failed++
          console.warn(
            `[automation-tick] createBundle 실패 (automation ${row.id}):`,
            (err as Error).message,
          )
        }
      }

      // 4) 결과 기록
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin.from('persona_automations') as any)
        .update({
          last_run_status: fail === 0 ? 'ok' : ok > 0 ? 'partial' : 'failed',
        })
        .eq('id', row.id)
    }

    return ApiResponse.ok(results)
  },
)
