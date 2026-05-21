import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { captureServerEvent } from '@/src/lib/posthog/server'
import { applyRateLimit, getClientIp } from '@/src/lib/rate-limit'
import {
  MICRO_PROMPTS,
  computeCooldown,
} from '@/src/lib/micro-prompts/questions'
import type { Json } from '@/src/types/database'

/**
 * POST /api/micro-prompts/respond
 *
 * Body: { questionId, action: 'answered'|'skipped'|'dismissed', response?, context? }
 *
 * 처리:
 * 1. micro_prompts_log에 append
 * 2. micro_prompts_cooldown upsert (next_available_at 연장)
 * 3. answered인 경우 profiles 테이블에 personality patch 적용
 */
export const POST = withErrorCapture(async (request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return ApiResponse.unauthorized()
  }

  // 쓰기 경로 — user 기반 rate limit (personality patch + log insert).
  // 정상 흐름은 세션당 1~2회. 자동화 남용 방어.
  const rateLimitResponse = applyRateLimit(user.id, getClientIp(request))
  if (rateLimitResponse) return rateLimitResponse

  const body = await request.json()
  const { questionId, action, response, context } = body

  if (!questionId || !action) {
    return ApiResponse.badRequest('questionId와 action은 필수입니다')
  }

  if (!['answered', 'skipped', 'dismissed'].includes(action)) {
    return ApiResponse.badRequest('action은 answered|skipped|dismissed 중 하나여야 합니다')
  }

  // 1. Log 기록
  const { error: logError } = await supabase
    .from('micro_prompts_log')
    .insert({
      user_id: user.id,
      question_id: questionId,
      action,
      response: response ?? null,
      context: context ?? null,
    })

  if (logError) {
    console.error('[micro-prompts/respond] log insert failed:', logError.message)
    return ApiResponse.internalError('응답 기록에 실패했습니다', logError.message)
  }

  // 2. Cooldown 계산 + upsert
  const { data: existingCooldown } = await supabase
    .from('micro_prompts_cooldown')
    .select('consecutive_skips')
    .eq('user_id', user.id)
    .maybeSingle()

  const consecutive = existingCooldown?.consecutive_skips ?? 0
  const { nextAvailableAt, resetConsecutive } = computeCooldown(
    action as 'answered' | 'skipped' | 'dismissed',
    consecutive,
  )

  await supabase
    .from('micro_prompts_cooldown')
    .upsert({
      user_id: user.id,
      next_available_at: nextAvailableAt.toISOString(),
      consecutive_skips: resetConsecutive ? 0 : consecutive + 1,
      last_shown_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  // 3. answered인 경우 profiles patch
  if (action === 'answered') {
    const prompt = MICRO_PROMPTS.find(p => p.id === questionId)
    if (prompt) {
      const patch = prompt.applyResponse(response)
      const personalityPatch = patch.personality_patch as Record<string, unknown> | undefined

      if (personalityPatch) {
        // personality는 jsonb 필드. 기존 값에 머지.
        const { data: profile } = await supabase
          .from('profiles')
          .select('personality')
          .eq('user_id', user.id)
          .maybeSingle()

        const existing = (profile?.personality as Record<string, unknown>) ?? {}
        const merged = { ...existing, ...personalityPatch }

        await supabase
          .from('profiles')
          .update({ personality: merged as Json })
          .eq('user_id', user.id)
      }
    }

    captureServerEvent('micro_prompt_answered', {
      userId: user.id,
      questionId,
      context,
    }).catch(() => {})
  } else {
    captureServerEvent('micro_prompt_skipped', {
      userId: user.id,
      questionId,
      action,
      context,
      consecutive_skips: resetConsecutive ? 0 : consecutive + 1,
    }).catch(() => {})
  }

  return ApiResponse.ok({
    success: true,
    nextAvailableAt: nextAvailableAt.toISOString(),
  })
})
