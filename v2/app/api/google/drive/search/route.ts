import { type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { getValidAccessToken } from '@/src/lib/google/tokens'
import { searchDriveItems } from '@/src/lib/google/drive'

// GET /api/google/drive/search?q=FLIP&type=folder
//   - 매니저 본인의 Drive 에서 키워드 매칭 검색
//   - 매니저 외 다른 유저의 자료는 OAuth 토큰 권한상 자동 차단

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  const type = searchParams.get('type') === 'sheet' ? 'sheet' : 'folder'

  if (!q || q.length < 1) {
    return ApiResponse.ok({ items: [] })
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  try {
    const accessToken = await getValidAccessToken(user.id)
    const items = await searchDriveItems(accessToken, q, type)
    return ApiResponse.ok({ items })
  } catch (e) {
    return ApiResponse.internalError(`Drive 검색 실패: ${(e as Error).message}`)
  }
}
