import { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

export const runtime = 'nodejs'

/**
 * GET /api/onboarding/micro-prompts
 *
 * 현재 유저의 micro-prompt 응답 히스토리 조회.
 * 쿨다운 판단(최근 24h 이내 응답 수) + 이미 답한 질문 필터 용도.
 *
 * 반환: { answered: string[], recentCount: number }
 */
export const GET = withErrorCapture(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('micro_prompts_log')
    .select('question_id, created_at')
    .eq('user_id', user.id)

  const rows = (data ?? []) as Array<{ question_id: string; created_at: string }>
  const answered = rows.map(r => r.question_id)
  const recentCount = rows.filter(r => r.created_at >= since24h).length

  return ApiResponse.ok({ answered, recentCount })
})

/**
 * POST /api/onboarding/micro-prompts
 *
 * Body: { questionId: string, response: unknown, slot?: string, sessionKey?: string }
 *
 * - 같은 유저·같은 질문이면 upsert (최신 값만 유지)
 * - 1분 내 동일 질문 연속 전송 방지 (client spam 가드)
 * - response 는 interactive 위젯별 shape 이므로 jsonb 그대로 저장
 */
export const POST = withErrorCapture(async (request: NextRequest) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = await request.json().catch(() => ({}))
  const { questionId, response, slot, sessionKey } = body as {
    questionId?: string
    response?: unknown
    slot?: string
    sessionKey?: string
  }

  if (!questionId || typeof questionId !== 'string' || questionId.length > 80) {
    return ApiResponse.badRequest('questionId 가 유효하지 않습니다')
  }
  if (response === undefined || response === null) {
    return ApiResponse.badRequest('response 가 없습니다')
  }

  // 1분 내 동일 질문 중복 차단
  const oneMinAgo = new Date(Date.now() - 60_000).toISOString()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: recent } = await (supabase as any)
    .from('micro_prompts_log')
    .select('id, created_at')
    .eq('user_id', user.id)
    .eq('question_id', questionId)
    .gte('created_at', oneMinAgo)
    .limit(1)
    .maybeSingle()

  if (recent) {
    return ApiResponse.ok({ deduplicated: true })
  }

  // upsert — 같은 user+question 이면 update
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('micro_prompts_log').upsert(
    {
      user_id: user.id,
      question_id: questionId,
      response,
      slot: typeof slot === 'string' ? slot.slice(0, 40) : null,
      session_key: typeof sessionKey === 'string' ? sessionKey.slice(0, 80) : null,
      created_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,question_id' },
  )

  if (error) {
    // 마이그레이션 미적용 등 — schema cache 에러는 조용히 무시
    if (error.message?.includes('column') || error.message?.includes('schema')) {
      return ApiResponse.ok({ pendingMigration: true })
    }
    return ApiResponse.internalError('micro prompt 저장 실패', error.message)
  }

  return ApiResponse.ok({ saved: true })
})
