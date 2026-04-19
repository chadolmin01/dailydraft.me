import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { applyRateLimit, getClientIp } from '@/src/lib/rate-limit'
import { pickNextPrompt, getQuestionConfig } from '@/src/lib/micro-prompts/questions'

/**
 * GET /api/micro-prompts/next
 *
 * 다음에 노출할 ambient 질문 반환.
 * 응답: { prompt: { id, sourceKey, prompt, config } | null, reason?: 'cooldown' | 'exhausted' }
 *
 * 로직:
 * 1. cooldown 체크 — next_available_at > now() → null 반환
 * 2. 이미 answered한 질문 제외
 * 3. priority 순으로 다음 픽
 */
export const GET = withErrorCapture(async (request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // 비인증 유저: ambient 슬롯 안 띄움
    return ApiResponse.ok({ prompt: null, reason: 'unauthenticated' })
  }

  // 인증 유저 기준 rate limit (loading.tsx 재트리거 + 반복 호출 방어).
  // 정상 동작은 페이지 전환당 1회라 분당 60 여유 충분.
  const rateLimitResponse = applyRateLimit(user.id, getClientIp(request))
  if (rateLimitResponse) return rateLimitResponse

  // cooldown 조회
  const { data: cooldown } = await supabase
    .from('micro_prompts_cooldown')
    .select('next_available_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (cooldown?.next_available_at) {
    const nextAt = new Date(cooldown.next_available_at).getTime()
    if (nextAt > Date.now()) {
      return ApiResponse.ok({ prompt: null, reason: 'cooldown' })
    }
  }

  // 이미 answered한 질문 ID 조회
  const { data: answered } = await supabase
    .from('micro_prompts_log')
    .select('question_id')
    .eq('user_id', user.id)
    .eq('action', 'answered')

  const answeredIds = new Set((answered ?? []).map(r => r.question_id as string))
  const nextPrompt = pickNextPrompt(answeredIds)

  if (!nextPrompt) {
    return ApiResponse.ok({ prompt: null, reason: 'exhausted' })
  }

  const config = getQuestionConfig(nextPrompt.sourceKey)
  if (!config) {
    return ApiResponse.ok({ prompt: null, reason: 'config_missing' })
  }

  return ApiResponse.ok({
    prompt: {
      id: nextPrompt.id,
      sourceKey: nextPrompt.sourceKey,
      prompt: nextPrompt.prompt,
      config,
    },
  })
})
