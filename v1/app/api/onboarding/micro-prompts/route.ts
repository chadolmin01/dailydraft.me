import { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

export const runtime = 'nodejs'

/**
 * GET /api/onboarding/micro-prompts
 *
 * 현재 유저의 micro-prompt 응답 전체 조회.
 *
 * 반환:
 *   - answered: string[] — 이미 답한 question_id 리스트 (쿨다운·중복 필터용)
 *   - recentCount: number — 최근 24h 응답 수 (하루 쿨다운 계산용)
 *   - responses: Record<question_id, value> — 실제 응답 값
 *     인터뷰 페이지가 "이미 답한 질문 스킵 + 저장 시 값 재사용" 하는 데 필요.
 */
export const GET = withErrorCapture(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('micro_prompts_log')
    .select('question_id, response, created_at')
    .eq('user_id', user.id)

  // 마이그레이션 미적용 시 빈 상태 반환 (graceful fallback)
  if (error && (error.message?.includes('column') || error.message?.includes('schema') || error.message?.includes('relation'))) {
    return ApiResponse.ok({ answered: [], recentCount: 0, responses: {} })
  }

  const rows = (data ?? []) as Array<{ question_id: string; response: unknown; created_at: string }>
  const answered = rows.map(r => r.question_id)
  const recentCount = rows.filter(r => r.created_at >= since24h).length
  const responses: Record<string, unknown> = Object.fromEntries(
    rows.map(r => [r.question_id, r.response]),
  )

  return ApiResponse.ok({ answered, recentCount, responses })
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
