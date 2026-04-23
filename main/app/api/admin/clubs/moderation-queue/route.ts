import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

export const runtime = 'nodejs'

/**
 * GET /api/admin/clubs/moderation-queue?status=pending
 *
 * Platform admin 이 보는 클럽 인증 신청 대기열.
 * ?status=pending (기본), verified, rejected, all
 */
export const GET = withErrorCapture(async (request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  // RPC 타입은 generated types 에 없어 any 캐스팅
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: isAdmin } = await (supabase as any)
    .rpc('is_platform_admin', { p_user_id: user.id })
  if (!isAdmin) return ApiResponse.forbidden('관리자 권한이 필요합니다')

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? 'pending'
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 200)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (supabase as any)
    .from('clubs')
    .select(`
      id, slug, name, created_by, created_at,
      claim_status, university_id,
      verification_submitted_at, verification_reviewed_at, verification_note,
      verification_documents
    `)
    .order('verification_submitted_at', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (status !== 'all') q = q.eq('claim_status', status)

  const { data: clubs, error } = await q
  if (error) return ApiResponse.internalError('조회 실패', error.message)
  if (!clubs || clubs.length === 0) {
    return ApiResponse.ok({ items: [], total: 0 })
  }

  // 대학 이름 조회
  const univIds = Array.from(new Set(
    (clubs as Array<{ university_id: string | null }>).map(c => c.university_id).filter(Boolean),
  )) as string[]
  const univMap: Record<string, { name: string; short_name: string | null }> = {}
  if (univIds.length > 0) {
    const { data: univs } = await supabase
      .from('universities')
      .select('id, name, short_name')
      .in('id', univIds)
    for (const u of univs ?? []) univMap[u.id] = { name: u.name, short_name: u.short_name }
  }

  // creator 닉네임
  const creatorIds = Array.from(new Set((clubs as Array<{ created_by: string }>).map(c => c.created_by)))
  const creatorMap: Record<string, { nickname: string | null; avatar_url: string | null }> = {}
  if (creatorIds.length > 0) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('user_id, nickname, avatar_url')
      .in('user_id', creatorIds)
    for (const p of profs ?? []) creatorMap[p.user_id] = { nickname: p.nickname, avatar_url: p.avatar_url }
  }

  const items = (clubs as Array<Record<string, unknown>>).map(c => ({
    ...c,
    university: c.university_id ? univMap[c.university_id as string] ?? null : null,
    creator: creatorMap[c.created_by as string] ?? null,
  }))

  return ApiResponse.ok({ items, total: items.length })
})
