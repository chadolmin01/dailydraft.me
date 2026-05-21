import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { getValidAccessToken, GoogleAuthRequiredError } from '@/src/lib/google/tokens'

// GET /api/google/access-token
//
// Google Picker 가 클라이언트에서 사용자 Drive 에 접근하려면 access_token 이 브라우저에
// 노출돼야 한다 (이게 Picker 의 설계). 토큰은 1시간 만료, scope 는 drive.readonly /
// spreadsheets / gmail.compose 로 제한.
//
// 보안 고려:
//   - 로그인 세션 있는 본인만 호출 가능
//   - 토큰 자체는 본인 Google 계정의 자료에만 권한 → 노출돼도 본인 데이터만 영향
//   - V1 = 매니저 1명 → 멀티 테넌트 노출 면적 X
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  try {
    const access_token = await getValidAccessToken(user.id)
    return ApiResponse.ok({ access_token })
  } catch (e) {
    if (e instanceof GoogleAuthRequiredError) return ApiResponse.googleAuthRequired(e.message)
    return ApiResponse.internalError((e as Error).message)
  }
}
