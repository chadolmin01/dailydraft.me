import { type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { getValidAccessToken, GoogleAuthRequiredError } from '@/src/lib/google/tokens'
import { getFolderMeta } from '@/src/lib/google/drive'

// GET /api/google/drive/folder-meta?id=DRIVE_ID
//   - 폴더 ID 만 받아서 이름·mimeType 즉시 반환. AddFolderForm 의 라이브 미리보기용.
//   - getFolderMeta 한 번만 호출 → 빠름

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')?.trim()
  if (!id) return ApiResponse.badRequest('id 필요')

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  try {
    const accessToken = await getValidAccessToken(user.id)
    const meta = await getFolderMeta(accessToken, id)
    return ApiResponse.ok(meta)
  } catch (e) {
    if (e instanceof GoogleAuthRequiredError) return ApiResponse.googleAuthRequired(e.message)
    return ApiResponse.notFound(`폴더 확인 실패: ${(e as Error).message}`)
  }
}
