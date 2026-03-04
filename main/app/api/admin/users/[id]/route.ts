import { createClient } from '@/src/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { ApiResponse } from '@/src/lib/api-utils'
import { logError } from '@/src/lib/error-logging'

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
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: targetUserId } = await params

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    // Check if current user is admin
    if (user.app_metadata?.is_admin !== true) {
      return ApiResponse.forbidden('관리자만 접근할 수 있습니다')
    }

    const body = await request.json()
    const { is_admin } = body

    if (typeof is_admin !== 'boolean') {
      return ApiResponse.badRequest('is_admin must be a boolean')
    }

    // Use admin client to update user's app_metadata
    const adminClient = getAdminClient()

    const { data, error } = await adminClient.auth.admin.updateUserById(targetUserId, {
      app_metadata: { is_admin },
    })

    if (error) {
      return ApiResponse.internalError('Failed to update user', error.message)
    }

    return ApiResponse.ok({
      user_id: data.user.id,
      email: data.user.email,
      is_admin: data.user.app_metadata?.is_admin,
      message: is_admin ? '관리자 권한이 부여되었습니다' : '관리자 권한이 해제되었습니다',
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    await logError({
      level: 'error',
      source: 'api',
      errorCode: err.name,
      message: err.message,
      stackTrace: err.stack,
      endpoint: '/api/admin/users/[id]',
      method: 'PATCH',
    })
    return ApiResponse.internalError('Failed to update user', err.message)
  }
}

// GET: Get user's admin status
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: targetUserId } = await params

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    // Check if current user is admin
    if (user.app_metadata?.is_admin !== true) {
      return ApiResponse.forbidden('관리자만 접근할 수 있습니다')
    }

    // Use admin client to get user
    const adminClient = getAdminClient()

    const { data, error } = await adminClient.auth.admin.getUserById(targetUserId)

    if (error) {
      return ApiResponse.internalError('Failed to get user', error.message)
    }

    if (!data.user) {
      return ApiResponse.notFound('User not found')
    }

    return ApiResponse.ok({
      user_id: data.user.id,
      email: data.user.email,
      is_admin: data.user.app_metadata?.is_admin === true,
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    await logError({
      level: 'error',
      source: 'api',
      errorCode: err.name,
      message: err.message,
      stackTrace: err.stack,
      endpoint: '/api/admin/users/[id]',
      method: 'GET',
    })
    return ApiResponse.internalError('Failed to get user', err.message)
  }
}
