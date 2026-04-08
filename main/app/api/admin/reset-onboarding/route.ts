import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

export const POST = withErrorCapture(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata?.is_admin !== true) {
    return ApiResponse.unauthorized()
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      onboarding_completed: false,
      ai_chat_completed: false,
      personality: null,
      vision_summary: null,
    })
    .eq('user_id', user.id)

  if (error) {
    return ApiResponse.internalError()
  }

  return ApiResponse.ok({ message: 'Onboarding reset' })
})
