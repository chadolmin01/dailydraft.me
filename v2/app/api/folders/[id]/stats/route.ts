import { type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { ApiResponse, isValidUUID } from '@/src/lib/api-utils'
import { getValidAccessToken, GoogleAuthRequiredError } from '@/src/lib/google/tokens'
import { listFolderFiles } from '@/src/lib/google/drive'

// GET /api/folders/[id]/stats
//   - 폴더의 간단한 통계 — 파일 카드용
//   - file_count, latest_modified (ISO), latest_name
//   - 캐시 무효화는 React Query staleTime 으로 (이 라우트는 항상 fresh 반환)

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  if (!isValidUUID(id)) return ApiResponse.badRequest('잘못된 폴더 ID')

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const { data: folder } = await supabase
    .from('folders')
    .select('id, drive_folder_id')
    .eq('id', id)
    .maybeSingle()

  if (!folder || !folder.drive_folder_id) return ApiResponse.notFound('폴더 없음')

  try {
    const accessToken = await getValidAccessToken(user.id)
    const files = await listFolderFiles(accessToken, folder.drive_folder_id)

    // 폴더 자신만 빼고 — 서브폴더는 통계에 포함 (전체 활동량 지표)
    const latest = files.reduce<typeof files[0] | null>((best, f) => {
      if (!best) return f
      return f.modifiedTime > best.modifiedTime ? f : best
    }, null)

    return ApiResponse.ok({
      file_count: files.length,
      latest_modified: latest?.modifiedTime ?? null,
      latest_name: latest?.name ?? null,
    })
  } catch (e) {
    if (e instanceof GoogleAuthRequiredError) return ApiResponse.googleAuthRequired(e.message)
    return ApiResponse.internalError(`통계 조회 실패: ${(e as Error).message}`)
  }
}
