/**
 * persona_automations 실행 로직 — 순수 함수.
 *
 * 두 곳에서 호출:
 *   1) /api/cron/persona-automations-tick — 수동 트리거 (디버깅·로컬 테스트)
 *   2) /api/cron/publish-scheduled 끝에서 체이닝 — Vercel Hobby 크론 개수 한도 회피
 *
 * Vercel 플랜별 cron 수/빈도 제한이 있어 두 작업을 별도 cron으로 등록하지 않고
 * 하나의 5분 주기 크론이 모두 처리하도록 통합.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { createBundle, approveBundle } from './bundles'
import { computeNextRunAt, type Frequency } from './automation-schedule'
import type { EventType } from './types'

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

export interface AutomationTickResult {
  processed: number
  generated: number
  published: number
  failed: number
}

export async function runAutomationTick(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: SupabaseClient<any, any, any>,
): Promise<AutomationTickResult> {
  const now = new Date()
  const nowIso = now.toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows, error } = await (admin.from('persona_automations' as never) as any)
    .select(
      'id, persona_id, event_type, frequency, run_hour, run_minute, run_weekday, run_day_of_month, daily_count, auto_publish, default_metadata, active, created_by',
    )
    .eq('active', true)
    .lte('next_run_at', nowIso)
    .limit(50)

  if (error) {
    console.error('[automation-tick] 조회 실패:', error)
    throw new Error(`조회 실패: ${error.message}`)
  }

  const targets = (rows ?? []) as AutomationRow[]
  const results: AutomationTickResult = {
    processed: 0,
    generated: 0,
    published: 0,
    failed: 0,
  }

  for (const row of targets) {
    results.processed++

    // 1) next_run_at을 먼저 미뤄 중복 실행 방지 (race guard)
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
    await (admin.from('persona_automations' as never) as any)
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

    // 3) 결과 기록
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from('persona_automations' as never) as any)
      .update({
        last_run_status: fail === 0 ? 'ok' : ok > 0 ? 'partial' : 'failed',
      })
      .eq('id', row.id)
  }

  return results
}
