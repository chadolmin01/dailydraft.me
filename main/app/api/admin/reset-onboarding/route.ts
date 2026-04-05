import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.app_metadata?.is_admin !== true) {
      return ApiResponse.unauthorized()
    }

    // Reset onboarding flags for current admin user
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
  } catch {
    return ApiResponse.internalError()
  }
}
