import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

type AuthCheckError = { error: NextResponse }
type AuthCheckOk = {
  user: { id: string }
  club: { id: string }
  admin: ReturnType<typeof createAdminClient>
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

  return { user, club, admin: createAdminClient() }
}

export const PATCH = withErrorCapture(async (request, context) => {
  const { slug, eventId } = await context.params
  const check = await requireAdmin(slug)
  if ('error' in check) return check.error

  const body = await request.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}
  const str = (v: unknown, maxLen = 300) => typeof v === 'string' ? v.trim().slice(0, maxLen) : null
  if (body.title !== undefined) updates.title = str(body.title, 300)
  if (body.description !== undefined) updates.description = str(body.description, 2000)
  if (body.event_type !== undefined) updates.event_type = body.event_type
  if (body.location !== undefined) updates.location = str(body.location)
  if (body.start_at !== undefined) updates.start_at = body.start_at
  if (body.end_at !== undefined) updates.end_at = body.end_at
  if (body.all_day !== undefined) updates.all_day = Boolean(body.all_day)
  if (body.cohort !== undefined) updates.cohort = typeof body.cohort === 'string' && body.cohort.length > 0 ? body.cohort : null

  if (Object.keys(updates).length === 0) return ApiResponse.badRequest('변경할 항목 없음')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (check.admin as any)
    .from('club_events')
    .update(updates)
    .eq('id', eventId)
    .eq('club_id', check.club.id)
    .select()
    .single()

  if (error) return ApiResponse.internalError(error.message)
  return ApiResponse.ok(data)
})

export const DELETE = withErrorCapture(async (_request, context) => {
  const { slug, eventId } = await context.params
  const check = await requireAdmin(slug)
  if ('error' in check) return check.error

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (check.admin as any)
    .from('club_events')
    .delete()
    .eq('id', eventId)
    .eq('club_id', check.club.id)

  if (error) return ApiResponse.internalError(error.message)
  return ApiResponse.ok({ deleted: true })
})
