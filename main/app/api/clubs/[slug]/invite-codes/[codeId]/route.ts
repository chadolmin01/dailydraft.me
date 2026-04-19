/**
 * PATCH/DELETE /api/clubs/[slug]/invite-codes/[codeId]
 *
 * PATCH { is_active: boolean } — 활성/비활성 토글 (유출 시 즉시 차단)
 * DELETE — 코드 삭제
 *
 * 권한: club admin/owner
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse, parseJsonBody } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

type AuthCheckError = { error: NextResponse }
type AuthCheckOk = {
  supabase: Awaited<ReturnType<typeof createClient>>
  club: { id: string }
}

async function requireClubAdmin(slug: string): Promise<AuthCheckError | AuthCheckOk> {
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
    .in('role', ['owner', 'admin'])
    .maybeSingle()
  if (!membership) return { error: ApiResponse.forbidden('운영진만 초대 코드를 관리할 수 있습니다') }

  return { supabase, club }
}

export const PATCH = withErrorCapture(async (request, context) => {
  const { slug, codeId } = await context.params
  const check = await requireClubAdmin(slug)
  if ('error' in check) return check.error
  const { supabase, club } = check

  const body = await parseJsonBody<{ is_active?: boolean }>(request)
  if (body instanceof Response) return body

  if (typeof body.is_active !== 'boolean') {
    return ApiResponse.badRequest('is_active 필드가 필요합니다')
  }

  const { data, error } = await supabase
    .from('club_invite_codes')
    .update({ is_active: body.is_active })
    .eq('id', codeId)
    .eq('club_id', club.id)
    .select()
    .single()

  if (error) return ApiResponse.internalError(error.message)
  return ApiResponse.ok(data)
})

export const DELETE = withErrorCapture(async (_request, context) => {
  const { slug, codeId } = await context.params
  const check = await requireClubAdmin(slug)
  if ('error' in check) return check.error
  const { supabase, club } = check

  const { error } = await supabase
    .from('club_invite_codes')
    .delete()
    .eq('id', codeId)
    .eq('club_id', club.id)

  if (error) return ApiResponse.internalError(error.message)
  return ApiResponse.ok({ deleted: true })
})
