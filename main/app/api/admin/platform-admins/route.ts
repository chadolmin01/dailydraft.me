import { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { isPlatformSuperadmin, isPlatformAdmin } from '@/src/lib/auth/platform-admin'

export const runtime = 'nodejs'

/**
 * Platform Admins 관리 API.
 *
 * 읽기: platform admin 이상.
 * 쓰기(부여·박탈): superadmin 만 — 권한 escalation 방지.
 * 감사: 모든 변경은 DB trigger 가 audit_logs 에 자동 기록.
 *
 * GET    — 리스트 (user_id 조인해 email·nickname 포함)
 * POST   — 부여 (body: { user_id, role?, notes? })
 * DELETE — 박탈 (query: ?user_id=<uuid>)
 */

export const GET = withErrorCapture(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()
  if (!(await isPlatformAdmin(supabase, user))) {
    return ApiResponse.forbidden('플랫폼 관리자만 접근 가능합니다')
  }

  const admin = createAdminClient()
  // platform_admins + profiles join. generated types 미반영이라 cast.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows, error } = await (admin as any)
    .from('platform_admins')
    .select('user_id, role, notes, granted_at, granted_by')
    .order('granted_at', { ascending: false })

  if (error) return ApiResponse.internalError('리스트 실패', error.message)

  const userIds = Array.from(new Set([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...rows.map((r: any) => r.user_id),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...rows.map((r: any) => r.granted_by).filter(Boolean),
  ]))

  const { data: profiles } = await admin
    .from('profiles')
    .select('user_id, nickname, avatar_url')
    .in('user_id', userIds)

  const profMap = new Map((profiles ?? []).map((p) => [p.user_id, p]))

  return ApiResponse.ok({
    admins: rows.map((r: Record<string, unknown>) => ({
      user_id: r.user_id,
      role: r.role,
      notes: r.notes,
      granted_at: r.granted_at,
      granted_by: r.granted_by,
      nickname: profMap.get(r.user_id as string)?.nickname ?? null,
      avatar_url: profMap.get(r.user_id as string)?.avatar_url ?? null,
      granted_by_nickname: r.granted_by ? profMap.get(r.granted_by as string)?.nickname ?? null : null,
    })),
  })
})

export const POST = withErrorCapture(async (request: NextRequest) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()
  if (!(await isPlatformSuperadmin(supabase, user))) {
    return ApiResponse.forbidden('superadmin 만 새 admin 을 부여할 수 있습니다')
  }

  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const target = typeof body.user_id === 'string' ? body.user_id : null
  const role = body.role === 'superadmin' ? 'superadmin' : 'admin'
  const notes = typeof body.notes === 'string' ? String(body.notes).slice(0, 500) : null

  if (!target) return ApiResponse.badRequest('user_id 필수')

  const admin = createAdminClient()
  // 대상 유저가 실제 존재하는지 확인
  const { data: targetUser } = await admin.auth.admin.getUserById(target)
  if (!targetUser?.user) return ApiResponse.notFound('해당 user_id 에 해당하는 유저가 없습니다')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('platform_admins')
    .insert({ user_id: target, role, notes, granted_by: user.id })

  if (error) return ApiResponse.internalError('부여 실패', error.message)
  return ApiResponse.ok({ success: true })
})

export const DELETE = withErrorCapture(async (request: NextRequest) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()
  if (!(await isPlatformSuperadmin(supabase, user))) {
    return ApiResponse.forbidden('superadmin 만 admin 을 박탈할 수 있습니다')
  }

  const target = new URL(request.url).searchParams.get('user_id')
  if (!target) return ApiResponse.badRequest('user_id 필수')

  // 자기 자신 박탈 금지 — lock-out 방지
  if (target === user.id) {
    return ApiResponse.badRequest('자기 자신을 admin 에서 제거할 수 없습니다')
  }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('platform_admins')
    .delete()
    .eq('user_id', target)

  if (error) return ApiResponse.internalError('박탈 실패', error.message)
  return ApiResponse.ok({ success: true })
})
