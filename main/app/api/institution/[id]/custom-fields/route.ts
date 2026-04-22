import { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { validateSchema, type CustomFieldsSchema } from '@/src/lib/institution/custom-fields'

export const runtime = 'nodejs'

/**
 * /api/institution/[id]/custom-fields
 *
 * 기관 관리자가 자기 기관의 커스텀 필드 스키마를 정의·수정.
 *
 * - GET: 현재 스키마 반환 (기관 멤버면 조회 가능 — 본인이 답할 때 필요)
 * - PUT: 전체 스키마 교체 (기관 관리자 전용)
 */

async function isInstitutionAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  institutionId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('institution_members')
    .select('role')
    .eq('user_id', userId)
    .eq('institution_id', institutionId)
    .maybeSingle()
  return data?.role === 'admin'
}

export const GET = withErrorCapture(
  async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id: institutionId } = await ctx.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    // 기관 멤버만 조회 가능 — RLS 로 처리되지만 명시
    const { data: membership } = await supabase
      .from('institution_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('institution_id', institutionId)
      .maybeSingle()
    if (!membership) return ApiResponse.forbidden('기관 멤버만 조회 가능합니다')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inst, error } = await (supabase as any)
      .from('institutions')
      .select('custom_fields_schema')
      .eq('id', institutionId)
      .maybeSingle()

    if (error) {
      // 마이그레이션 미적용 — 빈 스키마 반환
      if (error.message?.includes('column') || error.message?.includes('schema')) {
        return ApiResponse.ok({ schema: [] })
      }
      return ApiResponse.internalError('조회 실패', error.message)
    }
    return ApiResponse.ok({ schema: (inst?.custom_fields_schema as CustomFieldsSchema) ?? [] })
  },
)

export const PUT = withErrorCapture(
  async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id: institutionId } = await ctx.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    if (!(await isInstitutionAdmin(supabase, user.id, institutionId))) {
      return ApiResponse.forbidden('기관 관리자만 커스텀 필드를 수정할 수 있습니다')
    }

    const body = await request.json().catch(() => ({}))
    const { schema } = body as { schema?: unknown }
    if (!validateSchema(schema)) {
      return ApiResponse.badRequest(
        '스키마가 올바르지 않습니다. 필드 20개 이하 · id 는 영문 소문자로 시작 · 라벨 1~80자 등을 확인해 주세요.',
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('institutions')
      .update({ custom_fields_schema: schema, updated_at: new Date().toISOString() })
      .eq('id', institutionId)

    if (error) {
      if (error.message?.includes('column') || error.message?.includes('schema')) {
        return ApiResponse.ok({ pendingMigration: true })
      }
      return ApiResponse.internalError('저장 실패', error.message)
    }

    return ApiResponse.ok({ saved: true })
  },
)
