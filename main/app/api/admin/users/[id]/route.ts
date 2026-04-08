import { createClient } from '@/src/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

// Create Supabase admin client with service_role key
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin credentials')
  }

  return createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// PATCH: Update user's admin status
export const PATCH = withErrorCapture(async (
  request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient()
  const { id: targetUserId } = await params

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return ApiResponse.unauthorized()
  }

  if (user.app_metadata?.is_admin !== true) {
    return ApiResponse.forbidden('관리자만 접근할 수 있습니다')
  }

  const body = await request.json()
  const { is_admin } = body

  if (typeof is_admin !== 'boolean') {
    return ApiResponse.badRequest('is_admin must be a boolean')
  }

  const adminClient = getAdminClient()

  const { data, error } = await adminClient.auth.admin.updateUserById(targetUserId, {
    app_metadata: { is_admin },
  })

  if (error) {
    return ApiResponse.internalError('Failed to update user')
  }

  return ApiResponse.ok({
    user_id: data.user.id,
    email: data.user.email,
    is_admin: data.user.app_metadata?.is_admin,
    message: is_admin ? '관리자 권한이 부여되었습니다' : '관리자 권한이 해제되었습니다',
  })
})

// DELETE: Delete user (admin only)
export const DELETE = withErrorCapture(async (
  _request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient()
  const { id: targetUserId } = await params

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return ApiResponse.unauthorized()
  }

  if (user.app_metadata?.is_admin !== true) {
    return ApiResponse.forbidden('관리자만 접근할 수 있습니다')
  }

  if (targetUserId === user.id) {
    return ApiResponse.badRequest('자기 자신을 삭제할 수 없습니다')
  }

  const adminClient = getAdminClient()

  await adminClient.from('profiles').delete().eq('user_id', targetUserId)

  const { error } = await adminClient.auth.admin.deleteUser(targetUserId)

  if (error) {
    return ApiResponse.internalError('사용자 삭제 중 오류가 발생했습니다')
  }

  return ApiResponse.ok({ message: '사용자가 삭제되었습니다' })
})

// GET: Get user's admin status
export const GET = withErrorCapture(async (
  _request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient()
  const { id: targetUserId } = await params

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return ApiResponse.unauthorized()
  }

  if (user.app_metadata?.is_admin !== true) {
    return ApiResponse.forbidden('관리자만 접근할 수 있습니다')
  }

  const adminClient = getAdminClient()

  const { data, error } = await adminClient.auth.admin.getUserById(targetUserId)

  if (error) {
    return ApiResponse.internalError('Failed to get user')
  }

  if (!data.user) {
    return ApiResponse.notFound('User not found')
  }

  return ApiResponse.ok({
    user_id: data.user.id,
    email: data.user.email,
    is_admin: data.user.app_metadata?.is_admin === true,
  })
})
