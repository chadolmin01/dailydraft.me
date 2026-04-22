import { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { captureServerEvent } from '@/src/lib/posthog/server'

export const runtime = 'nodejs'

/**
 * POST /api/clubs/[id]/resubmit
 *
 * rejected 클럽의 creator 가 증빙을 보완한 뒤 다시 pending 으로 돌리는 API.
 * body: { verification_documents: {...} } — POST /api/clubs 와 동일 스키마
 *
 * 권한: clubs.created_by = auth.uid() AND claim_status = 'rejected'
 */
export const POST = withErrorCapture(
  async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id: clubId } = await ctx.params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    const body = await request.json().catch(() => ({}))
    const { verification_documents } = body as {
      verification_documents?: {
        representative_name?: string
        representative_email?: string
        founding_year?: number
        activity_summary?: string
        website_url?: string
        sns_url?: string
        charter_url?: string
      }
    }

    if (!verification_documents || typeof verification_documents !== 'object') {
      return ApiResponse.badRequest('증빙 정보를 입력해 주세요')
    }
    const docs = verification_documents
    const errors: Record<string, string> = {}
    if (!docs.representative_name?.trim()) errors.representative_name = '대표자 이름을 입력해 주세요'
    if (!docs.representative_email?.trim()) errors.representative_email = '대표자 이메일을 입력해 주세요'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(docs.representative_email.trim())) {
      errors.representative_email = '올바른 이메일 형식이 아닙니다'
    }
    const thisYear = new Date().getFullYear()
    if (!docs.founding_year || typeof docs.founding_year !== 'number'
      || docs.founding_year < 2000 || docs.founding_year > thisYear) {
      errors.founding_year = `창립 연도를 2000~${thisYear} 사이로 입력해 주세요`
    }
    const summary = docs.activity_summary?.trim() ?? ''
    if (summary.length < 50) errors.activity_summary = '활동 요약을 50자 이상 입력해 주세요'
    else if (summary.length > 500) errors.activity_summary = '활동 요약은 500자 이하로 입력해 주세요'
    if (Object.keys(errors).length > 0) {
      return ApiResponse.badRequest('입력값이 유효하지 않습니다', errors)
    }

    // 권한 확인 + 현 상태 체크
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: club } = await (supabase as any)
      .from('clubs')
      .select('id, slug, name, created_by, claim_status')
      .eq('id', clubId)
      .maybeSingle()
    if (!club) return ApiResponse.notFound('클럽을 찾을 수 없습니다')
    if (club.created_by !== user.id) return ApiResponse.forbidden('본인 클럽만 재제출할 수 있습니다')
    if (club.claim_status !== 'rejected') {
      return ApiResponse.badRequest(`현재 ${club.claim_status} 상태라 재제출할 수 없습니다`)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updErr } = await (supabase as any)
      .from('clubs')
      .update({
        claim_status: 'pending',
        verification_submitted_at: new Date().toISOString(),
        verification_reviewed_at: null,
        verification_reviewed_by: null,
        verification_note: null,
        verification_documents: {
          representative_name: docs.representative_name!.trim(),
          representative_email: docs.representative_email!.trim(),
          founding_year: docs.founding_year,
          activity_summary: summary,
          website_url: docs.website_url?.trim() || null,
          sns_url: docs.sns_url?.trim() || null,
          charter_url: docs.charter_url?.trim() || null,
        },
      })
      .eq('id', clubId)
    if (updErr) return ApiResponse.internalError('재제출 실패', updErr.message)

    captureServerEvent('club_verification_resubmitted', {
      userId: user.id,
      clubId,
      slug: club.slug,
    }).catch(() => {})

    return ApiResponse.ok({ resubmitted: true, slug: club.slug })
  }
)
