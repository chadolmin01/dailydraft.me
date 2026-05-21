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

export const DELETE = withErrorCapture(async (
  _request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata?.is_admin !== true) {
    return ApiResponse.unauthorized()
  }

  const { id } = await params
  const admin = getAdminClient()

  const { error } = await admin.from('opportunities').delete().eq('id', id)

  if (error) {
    return ApiResponse.internalError('Opportunity 삭제 중 오류가 발생했습니다')
  }

  return ApiResponse.ok({ message: 'Opportunity가 삭제되었습니다' })
})
