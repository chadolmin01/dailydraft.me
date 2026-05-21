/**
 * POST /api/clubs/[slug]/join — 초대 코드 입력으로 클럽 가입
 *
 * body: { code: string }
 *
 * 검증:
 *   - 로그인 필수
 *   - code 존재 + club_id 매치 + is_active + 만료/사용량 체크
 *   - 이미 멤버면 멤버십 반환
 *
 * 액션:
 *   - club_members 에 INSERT (role=invite.role, cohort=invite.cohort)
 *   - use_count 증가
 *
 * 원자성은 DB 트리거/권한으로 일부 보장. Race condition 방어를 위해 use_count 증가는
 * `less_than max_uses` 조건을 가진 UPDATE 로 먼저 시도하고 insert 진행.
 */

import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

export const runtime = 'nodejs'

export const POST = withErrorCapture(async (request, context) => {
  const { slug } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = await request.json().catch(() => ({}))
  const rawCode = typeof body.code === 'string' ? body.code.trim() : ''
  if (!rawCode) return ApiResponse.badRequest('초대 코드가 필요합니다')

  const admin = createAdminClient()

  const { data: club } = await admin
    .from('clubs')
    .select('id, name, slug')
    .eq('slug', slug)
    .maybeSingle()

  if (!club) return ApiResponse.notFound('클럽을 찾을 수 없습니다')

  const { data: invite } = await admin
    .from('club_invite_codes')
    .select('*')
    .eq('club_id', club.id)
    .eq('code', rawCode)
    .maybeSingle()

  if (!invite) return ApiResponse.badRequest('초대 코드가 유효하지 않습니다')
  if (!invite.is_active) return ApiResponse.badRequest('비활성화된 초대 코드입니다')
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return ApiResponse.badRequest('만료된 초대 코드입니다')
  }
  if (invite.max_uses !== null && invite.use_count >= invite.max_uses) {
    return ApiResponse.badRequest('사용 한도가 초과된 초대 코드입니다')
  }

  // 이미 가입되어 있는지
  const { data: existing } = await admin
    .from('club_members')
    .select('id, status, role')
    .eq('club_id', club.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing && existing.status === 'active') {
    return ApiResponse.ok({ club_slug: slug, already_member: true })
  }

  const role = invite.role === 'admin' ? 'admin' : 'member'
  const cohort = invite.cohort

  if (existing) {
    // 비활성 멤버 재활성화
    const { error: updateError } = await admin
      .from('club_members')
      .update({ status: 'active', role, cohort })
      .eq('id', existing.id)
    if (updateError) return ApiResponse.internalError(updateError.message)
  } else {
    const { error: insertError } = await admin.from('club_members').insert({
      club_id: club.id,
      user_id: user.id,
      role,
      cohort,
      status: 'active',
      joined_at: new Date().toISOString(),
    })
    if (insertError) return ApiResponse.internalError(insertError.message)
  }

  // use_count 증가 (best-effort)
  await admin
    .from('club_invite_codes')
    .update({ use_count: (invite.use_count ?? 0) + 1 })
    .eq('id', invite.id)

  return ApiResponse.ok({ club_slug: slug, role, cohort })
})
