/**
 * POST /api/clubs/join-by-code — 초대 코드만으로 클럽 찾아서 가입.
 *
 * 온보딩 마지막 단계에서 "초대 코드가 있나요?" 입력 시 slug 를 모르고도 가입할 수 있게.
 *
 * body: { code: string }
 * 반환: { club_slug, already_member?, role, cohort }
 */

import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

export const runtime = 'nodejs'

export const POST = withErrorCapture(async (request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = await request.json().catch(() => ({}))
  const rawCode = typeof body.code === 'string' ? body.code.trim() : ''
  if (!rawCode) return ApiResponse.badRequest('초대 코드가 필요합니다')

  const admin = createAdminClient()

  // 코드로 클럽 찾기
  const { data: invite } = await admin
    .from('club_invite_codes')
    .select('*, clubs(id, slug, name)')
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

  const club = (invite as unknown as { clubs: { id: string; slug: string; name: string } | null }).clubs
  if (!club) return ApiResponse.notFound('클럽을 찾을 수 없습니다')

  // 기존 멤버십 확인
  const { data: existing } = await admin
    .from('club_members')
    .select('id, status')
    .eq('club_id', club.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing && existing.status === 'active') {
    return ApiResponse.ok({
      club_slug: club.slug,
      club_name: club.name,
      already_member: true,
    })
  }

  const role = invite.role === 'admin' ? 'admin' : 'member'
  const cohort = invite.cohort

  if (existing) {
    const { error } = await admin
      .from('club_members')
      .update({ status: 'active', role, cohort })
      .eq('id', existing.id)
    if (error) return ApiResponse.internalError(error.message)
  } else {
    const { error } = await admin.from('club_members').insert({
      club_id: club.id,
      user_id: user.id,
      role,
      cohort,
      status: 'active',
      joined_at: new Date().toISOString(),
    })
    if (error) return ApiResponse.internalError(error.message)
  }

  await admin
    .from('club_invite_codes')
    .update({ use_count: (invite.use_count ?? 0) + 1 })
    .eq('id', invite.id)

  return ApiResponse.ok({
    club_slug: club.slug,
    club_name: club.name,
    role,
    cohort,
  })
})
