/**
 * POST /api/clubs/[slug]/announcements/[id]/read — 공지 읽음 표시 (본인)
 * GET — 읽음 현황 (운영진: N/M + 읽은 멤버 목록, 본인: 본인의 read_at)
 */

import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

export const POST = withErrorCapture(async (_request, context) => {
  const { id } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  // RLS가 멤버십 체크 처리
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('club_announcement_reads')
    .upsert(
      { announcement_id: id, user_id: user.id },
      { onConflict: 'announcement_id,user_id', ignoreDuplicates: true }
    )

  if (error) return ApiResponse.internalError(error.message)
  return ApiResponse.ok({ read: true })
})

export const GET = withErrorCapture(async (_request, context) => {
  const { slug, id } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

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
    .maybeSingle()

  if (!membership) return ApiResponse.forbidden('클럽 멤버만 조회 가능')

  const isAdmin = membership.role === 'admin' || membership.role === 'owner'
  const admin = createAdminClient()

  // 읽음 count + 전체 active 멤버 count
  const [readsRes, totalRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from('club_announcement_reads')
      .select('user_id, read_at', { count: 'exact' })
      .eq('announcement_id', id),
    admin
      .from('club_members')
      .select('user_id', { count: 'exact', head: true })
      .eq('club_id', club.id)
      .eq('status', 'active'),
  ])

  const reads = (readsRes.data ?? []) as Array<{ user_id: string; read_at: string }>
  const readUserIds = reads.map(r => r.user_id)

  // 본인 read_at
  const myRead = reads.find(r => r.user_id === user.id)

  return ApiResponse.ok({
    read_count: reads.length,
    total_members: totalRes.count ?? 0,
    is_read_by_me: !!myRead,
    my_read_at: myRead?.read_at ?? null,
    // 운영진만 read user IDs 공개 (nickname 노출은 별도 요청 시)
    read_user_ids: isAdmin ? readUserIds : undefined,
  })
})
