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

/** POST — 유저를 특정 institution에 배정 */
export const POST = withErrorCapture(async (
  request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient()
  const user = await requireAdmin(supabase)
  if (!user) return ApiResponse.forbidden('관리자 권한이 필요합니다')

  const { id: institutionId } = await params
  const body = await request.json()
  const { user_id, email, role = 'student' } = body

  if (!['student', 'mentor', 'admin'].includes(role)) {
    return ApiResponse.badRequest('유효하지 않은 역할입니다')
  }

  let targetUserId = user_id
  if (!targetUserId && email) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('contact_email', email)
      .limit(1)
      .single()
    if (!profile) return ApiResponse.notFound('해당 유저를 찾을 수 없습니다')
    targetUserId = profile.user_id
  }

  if (!targetUserId) return ApiResponse.badRequest('user_id 또는 email이 필요합니다')

  const { data: existing } = await supabase
    .from('institution_members')
    .select('id')
    .eq('institution_id', institutionId)
    .eq('user_id', targetUserId)
    .limit(1)
    .single()

  if (existing) return ApiResponse.badRequest('이미 소속된 멤버입니다')

  const { data, error } = await supabase
    .from('institution_members')
    .insert({
      institution_id: institutionId,
      user_id: targetUserId,
      role,
      status: 'active',
    })
    .select()
    .single()

  if (error) throw error
  return ApiResponse.created(data)
})
