import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'

export async function GET() {
  try {
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
  } catch (error) {
    return ApiResponse.internalError(
      '사용자 정보 조회 중 오류가 발생했습니다',
      undefined
    )
  }
}
