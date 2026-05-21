import { type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { ApiResponse, isValidUUID } from '@/src/lib/api-utils'
import { getValidAccessToken, GoogleAuthRequiredError } from '@/src/lib/google/tokens'
import { listFolderFiles } from '@/src/lib/google/drive'
import { parseFilenames } from '@/src/lib/parsers/filename'

// GET /api/folders/[id]/files
//   - 폴더의 Drive 파일 목록을 실시간으로 조회 (캐시 안 함)
//   - 파일명 컨벤션으로 파싱한 결과 + 미매칭 목록 함께 반환
//   - RLS 가 다른 매니저의 폴더는 조회 자체를 차단

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  if (!isValidUUID(id)) return ApiResponse.badRequest('잘못된 폴더 ID')

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  // RLS 가 자동으로 owner 검증 — 권한 없으면 maybeSingle 이 null 반환
  const { data: folder, error: folderError } = await supabase
    .from('folders')
    .select('id, name, drive_folder_id, program')
    .eq('id', id)
    .maybeSingle()

  if (folderError) return ApiResponse.internalError(folderError.message)
  if (!folder || !folder.drive_folder_id) return ApiResponse.notFound('폴더 없음')

  let files
  try {
    const accessToken = await getValidAccessToken(user.id)
    files = await listFolderFiles(accessToken, folder.drive_folder_id)
  } catch (e) {
    if (e instanceof GoogleAuthRequiredError) return ApiResponse.googleAuthRequired(e.message)
    return ApiResponse.internalError(`Drive 조회 실패: ${(e as Error).message}`)
  }

  const { parsed, unmatched } = parseFilenames(files.map(f => f.name))

  return ApiResponse.ok({
    folder: { id: folder.id, name: folder.name, program: folder.program },
    files,                        // 원본 (Drive 메타 포함)
    parsed,                       // 컨벤션 매칭된 파일
    unmatched,                    // 매칭 안 된 파일명 (사용자 안내용)
    summary: {
      total: files.length,
      matched: parsed.length,
      unmatched: unmatched.length,
    },
  })
}
