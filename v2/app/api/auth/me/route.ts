import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return ApiResponse.unauthorized()
  }

  return ApiResponse.ok({
    user: {
      id: user.id,
      email: user.email,
    },
  })
}
