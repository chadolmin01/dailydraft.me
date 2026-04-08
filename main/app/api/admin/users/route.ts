import { createClient } from '@/src/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export const GET = withErrorCapture(async (request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata?.is_admin !== true) {
    return ApiResponse.unauthorized()
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const offset = (page - 1) * limit

  const admin = getAdminClient()

  let query = admin
    .from('profiles')
    .select('user_id, nickname, university, contact_email, location, desired_position, skills, interest_tags, onboarding_completed, is_premium, created_at, updated_at', { count: 'exact' })

  if (search) {
    const sanitized = search.replace(/[^a-zA-Z0-9가-힣\s@.\-]/g, '').replace(/%/g, '\\%').replace(/_/g, '\\_')
    if (sanitized) {
      query = query.or(`nickname.ilike.%${sanitized}%,university.ilike.%${sanitized}%,contact_email.ilike.%${sanitized}%`)
    }
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

  const { data, count, error } = await query

  if (error) {
    return ApiResponse.internalError('사용자 조회 중 오류가 발생했습니다')
  }

  return ApiResponse.ok({
    users: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  })
})
