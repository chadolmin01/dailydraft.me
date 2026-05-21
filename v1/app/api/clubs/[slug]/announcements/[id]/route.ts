/**
 * DELETE/PATCH /api/clubs/[slug]/announcements/[id]
 * admin/owner 만 삭제·수정 (본인 또는 상위 권한)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

type AuthCheckError = { error: NextResponse }
type AuthCheckOk = {
  supabase: Awaited<ReturnType<typeof createClient>>
  user: { id: string }
  club: { id: string }
}

async function requireAdmin(slug: string): Promise<AuthCheckError | AuthCheckOk> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: ApiResponse.unauthorized() }

  const { data: club } = await supabase
    .from('clubs')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (!club) return { error: ApiResponse.notFound('클럽을 찾을 수 없습니다') }

  const { data: membership } = await supabase
    .from('club_members')
    .select('role')
    .eq('club_id', club.id)
    .eq('user_id', user.id)
    .in('role', ['admin', 'owner'])
    .maybeSingle()
  if (!membership) return { error: ApiResponse.forbidden('운영진만 관리할 수 있습니다') }

  return { supabase, user, club }
}

export const DELETE = withErrorCapture(async (_request, context) => {
  const { slug, id } = await context.params
  const check = await requireAdmin(slug)
  if ('error' in check) return check.error
  const { supabase, club } = check

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('club_announcements')
    .delete()
    .eq('id', id)
    .eq('club_id', club.id)

  if (error) return ApiResponse.internalError(error.message)
  return ApiResponse.ok({ deleted: true })
})

export const PATCH = withErrorCapture(async (request, context) => {
  const { slug, id } = await context.params
  const check = await requireAdmin(slug)
  if ('error' in check) return check.error
  const { supabase, club } = check

  const body = await request.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}
  if (typeof body.title === 'string') updates.title = body.title.trim()
  if (typeof body.content === 'string') updates.content = body.content.trim()
  if (typeof body.is_pinned === 'boolean') updates.is_pinned = body.is_pinned
  if (Object.keys(updates).length === 0) return ApiResponse.badRequest('변경할 항목 없음')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('club_announcements')
    .update(updates)
    .eq('id', id)
    .eq('club_id', club.id)
    .select()
    .single()

  if (error) return ApiResponse.internalError(error.message)
  return ApiResponse.ok(data)
})
