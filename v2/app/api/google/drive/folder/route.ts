import { type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { getValidAccessToken, GoogleAuthRequiredError } from '@/src/lib/google/tokens'
import { listFolderFiles } from '@/src/lib/google/drive'

// GET /api/google/drive/folder?id=DRIVE_FOLDER_ID
//   - 임의의 Drive 폴더 내용을 조회 (서브폴더 + 파일 모두)
//   - 권한 자체는 OAuth scope (drive.readonly) 가 처리 — 본인이 접근 가능한 폴더만 조회됨
//   - subfolders 와 files 를 분리해서 반환 (UI 가 다르게 렌더링)

const FOLDER_MIME = 'application/vnd.google-apps.folder'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const driveFolderId = searchParams.get('id')?.trim()

  if (!driveFolderId) return ApiResponse.badRequest('id 파라미터 필요')

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  try {
    const accessToken = await getValidAccessToken(user.id)
    const items = await listFolderFiles(accessToken, driveFolderId)

    const subfolders = items.filter(i => i.mimeType === FOLDER_MIME)
    const files = items.filter(i => i.mimeType !== FOLDER_MIME)

    return ApiResponse.ok({
      subfolders,
      files,
      summary: { total: items.length, subfolders: subfolders.length, files: files.length },
    })
  } catch (e) {
    if (e instanceof GoogleAuthRequiredError) return ApiResponse.googleAuthRequired(e.message)
    return ApiResponse.internalError(`Drive 조회 실패: ${(e as Error).message}`)
  }
}
