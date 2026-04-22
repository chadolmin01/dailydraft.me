import { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import {
  validateResponses,
  type CustomFieldsSchema,
} from '@/src/lib/institution/custom-fields'

export const runtime = 'nodejs'

/**
 * /api/institution/[id]/custom-responses
 *
 * 학생이 기관 커스텀 필드에 응답.
 *
 * - GET: 내 응답 불러오기 (수정 UI 초기값)
 * - PUT: 전체 응답 upsert (부분 업데이트도 허용하되 기본은 full replace)
 */

export const GET = withErrorCapture(
  async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id: institutionId } = await ctx.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('institution_custom_responses')
      .select('responses, submitted_at, updated_at')
      .eq('institution_id', institutionId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error && !error.message?.includes('schema')) {
      return ApiResponse.internalError('조회 실패', error.message)
    }

    return ApiResponse.ok({
      responses: (data?.responses as Record<string, unknown>) ?? {},
      submittedAt: data?.submitted_at ?? null,
      updatedAt: data?.updated_at ?? null,
    })
  },
)

export const PUT = withErrorCapture(
  async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id: institutionId } = await ctx.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    // 해당 기관 멤버인지 확인 — 비멤버는 응답 저장 불가
    const { data: membership } = await supabase
      .from('institution_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('institution_id', institutionId)
      .maybeSingle()
    if (!membership) return ApiResponse.forbidden('기관 멤버만 응답할 수 있습니다')

    const body = await request.json().catch(() => ({}))
    const { responses } = body as { responses?: Record<string, unknown> }
    if (!responses || typeof responses !== 'object') {
      return ApiResponse.badRequest('responses 가 올바르지 않습니다')
    }

    // 스키마 가져와 검증
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inst } = await (supabase as any)
      .from('institutions')
      .select('custom_fields_schema')
      .eq('id', institutionId)
      .maybeSingle()
    const schema = (inst?.custom_fields_schema as CustomFieldsSchema) ?? []

    const validation = validateResponses(schema, responses)
    if (!validation.ok) {
      return ApiResponse.badRequest('입력값이 유효하지 않습니다', validation.errors)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('institution_custom_responses')
      .upsert(
        {
          institution_id: institutionId,
          user_id: user.id,
          responses,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'institution_id,user_id' },
      )

    if (error) {
      if (error.message?.includes('column') || error.message?.includes('schema')) {
        return ApiResponse.ok({ pendingMigration: true })
      }
      return ApiResponse.internalError('저장 실패', error.message)
    }

    return ApiResponse.ok({ saved: true })
  },
)
