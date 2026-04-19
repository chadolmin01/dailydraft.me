import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const meta = user.app_metadata as Record<string, unknown> | undefined
  if (!meta?.is_admin) return null
  return user
}

/** PATCH — institution 수정 */
export const PATCH = withErrorCapture(async (
  request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient()
  const user = await requireAdmin(supabase)
  if (!user) return ApiResponse.forbidden('관리자 권한이 필요합니다')

  const { id } = await params
  const body = await request.json()
  const updates: Record<string, unknown> = {}

  if (body.name !== undefined) updates.name = body.name
  if (body.university !== undefined) updates.university = body.university
  if (body.type !== undefined) updates.type = body.type
  if (body.description !== undefined) updates.description = body.description || null
  if (body.email_domains !== undefined) updates.email_domains = Array.isArray(body.email_domains) ? body.email_domains : []
  if (body.contact_email !== undefined) updates.contact_email = body.contact_email || null

  if (Object.keys(updates).length === 0) {
    return ApiResponse.badRequest('수정할 항목이 없습니다')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('institutions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return ApiResponse.ok(data)
})

/** DELETE — institution 삭제 */
export const DELETE = withErrorCapture(async (
  _request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient()
  const user = await requireAdmin(supabase)
  if (!user) return ApiResponse.forbidden('관리자 권한이 필요합니다')

  const { id } = await params

  // 멤버 먼저 삭제
  await supabase
    .from('institution_members')
    .delete()
    .eq('institution_id', id)

  const { error } = await supabase
    .from('institutions')
    .delete()
    .eq('id', id)

  if (error) throw error
  return ApiResponse.ok({ deleted: true })
})
