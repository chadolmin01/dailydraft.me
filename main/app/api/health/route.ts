import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

export const GET = withErrorCapture(async () => {
  try {
    const supabase = await createClient()

    // Simple connectivity check without exposing schema details
    const { error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .limit(1)

    return ApiResponse.ok({
      status: error ? 'degraded' : 'ok',
      timestamp: new Date().toISOString()
    })
  } catch {
    return ApiResponse.internalError('서버 상태를 확인할 수 없습니다')
  }
})
