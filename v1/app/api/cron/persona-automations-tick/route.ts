/**
 * Persona Automations Tick — 수동 트리거 라우트.
 *
 * Vercel Hobby/Pro cron 개수 한도 때문에 별도 cron은 등록하지 않음.
 * 실제 자동 실행은 publish-scheduled cron이 끝나고 이 로직을 호출하는 방식.
 *
 * 이 라우트는 로컬 디버깅·관리자 수동 트리거용으로 유지.
 */

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withCronCapture } from '@/src/lib/posthog/with-cron-capture'
import { runAutomationTick } from '@/src/lib/personas/automation-tick'

export const runtime = 'nodejs'
export const maxDuration = 120

export const POST = withCronCapture(
  'persona-automations-tick',
  async (request: NextRequest) => {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return ApiResponse.unauthorized()
    }

    const admin = createAdminClient()
    try {
      const results = await runAutomationTick(admin)
      return ApiResponse.ok(results)
    } catch (err) {
      return ApiResponse.internalError(
        err instanceof Error ? err.message : String(err),
      )
    }
  },
)
