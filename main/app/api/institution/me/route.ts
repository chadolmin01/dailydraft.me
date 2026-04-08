import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

export const GET = withErrorCapture(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return ApiResponse.unauthorized()
  }

  const { data: membership } = await supabase
    .from('institution_members')
    .select(`
      role,
      institution_id,
      institutions ( name )
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .eq('role', 'admin')
    .limit(1)
    .single()

  if (!membership) {
    return ApiResponse.ok(null)
  }

  return ApiResponse.ok({
    institutionId: membership.institution_id,
    institutionName: (membership.institutions as any)?.name ?? '',
    role: membership.role,
  })
})
