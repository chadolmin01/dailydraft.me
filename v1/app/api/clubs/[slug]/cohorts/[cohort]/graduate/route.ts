/**
 * POST /api/clubs/[slug]/cohorts/[cohort]/graduate
 *
 * 특정 기수에 해당하는 active 멤버들을 alumni 상태로 전환.
 * cohort-transition 은 전체 멤버를 졸업시키지만 여기는 단일 기수만.
 *
 * body: { confirm: true }
 *
 * 되돌리기 어려운 작업. confirm 필수.
 */

import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

export const runtime = 'nodejs'

export const POST = withErrorCapture(async (request, context) => {
  const { slug, cohort } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = await request.json().catch(() => ({} as Record<string, unknown>))
  if (body.confirm !== true) {
    return ApiResponse.badRequest('confirm: true 를 보내야 합니다. 이 작업은 되돌리기 어렵습니다')
  }

  const { data: club } = await supabase
    .from('clubs')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (!club) return ApiResponse.notFound('클럽을 찾을 수 없습니다')

  const { data: membership } = await supabase
    .from('club_members')
    .select('role')
    .eq('club_id', club.id)
    .eq('user_id', user.id)
    .in('role', ['admin', 'owner'])
    .maybeSingle()

  if (!membership) return ApiResponse.forbidden('운영진만 기수 졸업 처리를 할 수 있습니다')

  const admin = createAdminClient()

  const { data: members } = await admin
    .from('club_members')
    .select('id, user_id')
    .eq('club_id', club.id)
    .eq('cohort', cohort)
    .eq('status', 'active')

  const ids = (members ?? []).map(m => m.id)
  if (ids.length === 0) {
    return ApiResponse.ok({ graduated: 0, cohort })
  }

  // 오너는 졸업 처리에서 제외 (운영 연속성)
  const { data: owners } = await admin
    .from('club_members')
    .select('id')
    .eq('club_id', club.id)
    .eq('cohort', cohort)
    .eq('role', 'owner')

  const ownerIds = new Set((owners ?? []).map(o => o.id))
  const graduatedIds = ids.filter(id => !ownerIds.has(id))

  if (graduatedIds.length === 0) {
    return ApiResponse.ok({ graduated: 0, cohort, note: '오너 외 졸업 대상 없음' })
  }

  const { error } = await admin
    .from('club_members')
    .update({ status: 'alumni', role: 'alumni' } as never)
    .in('id', graduatedIds)

  if (error) return ApiResponse.internalError(error.message)

  return ApiResponse.ok({ graduated: graduatedIds.length, cohort })
})
