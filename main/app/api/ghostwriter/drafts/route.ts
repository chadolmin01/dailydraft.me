import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

/** GET: 내 pending 초안 목록 */
export const GET = withErrorCapture(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('weekly_update_drafts')
    .select('id, opportunity_id, week_number, title, content, update_type, source_message_count, status, created_at')
    .eq('target_user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) return ApiResponse.internalError('초안 목록을 불러오지 못했습니다')

  return ApiResponse.ok(data)
})
