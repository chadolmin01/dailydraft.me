// POST /api/files/process
//   body: { folder_id: uuid, drive_file_id, filename, mime_type, size_bytes?, drive_modified_at? }
//
// 매니저가 파일 행에서 "처리" 버튼 클릭. processDriveFile 헬퍼 위임.
// GET 은 폴더 기준 처리 결과 목록.

import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse, isValidUUID } from '@/src/lib/api-utils'
import { getOrCreateWorkspace } from '@/src/lib/workspace'
import { getValidAccessToken, GoogleAuthRequiredError } from '@/src/lib/google/tokens'
import { processDriveFile } from '@/src/lib/m6/process-pipeline'

export const maxDuration = 60

interface Body {
  folder_id?: string
  drive_file_id?: string
  filename?: string
  mime_type?: string
  size_bytes?: number
  drive_modified_at?: string
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = (await request.json().catch(() => ({}))) as Body
  const { folder_id, drive_file_id, filename, mime_type } = body

  if (!folder_id || !isValidUUID(folder_id)) {
    return ApiResponse.badRequest('folder_id (uuid) 가 필요합니다')
  }
  if (!drive_file_id || !filename || !mime_type) {
    return ApiResponse.badRequest('drive_file_id, filename, mime_type 가 필요합니다')
  }

  const workspace = await getOrCreateWorkspace(supabase, user.id)

  // 폴더 소유권 확인 — RLS 우회 차단
  const { data: folder, error: folderErr } = await supabase
    .from('folders')
    .select('id, workspace_id')
    .eq('id', folder_id)
    .eq('workspace_id', workspace.id)
    .maybeSingle()
  if (folderErr) return ApiResponse.internalError(folderErr.message)
  if (!folder) return ApiResponse.notFound('해당 폴더를 찾을 수 없습니다')

  let accessToken: string
  try {
    accessToken = await getValidAccessToken(user.id)
  } catch (e) {
    if (e instanceof GoogleAuthRequiredError) {
      return NextResponse.json(
        { error: { code: 'GOOGLE_AUTH_REQUIRED', message: e.message } },
        { status: 401 },
      )
    }
    return ApiResponse.internalError((e as Error).message)
  }

  const admin = createAdminClient()
  const result = await processDriveFile({
    admin,
    workspaceId: workspace.id,
    folderId: folder_id,
    accessToken,
    driveFileId: drive_file_id,
    filename,
    mimeType: mime_type,
    sizeBytes: body.size_bytes ?? null,
    driveModifiedAt: body.drive_modified_at ?? null,
  })

  return ApiResponse.ok({
    id: result.processedFileId,
    status: result.status,
    atoms: result.atomCount,
    relations: result.relationCount,
    error: result.error,
  })
}

// GET /api/files/process?folder_id=... — 해당 폴더의 처리 결과 목록.
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const folderId = request.nextUrl.searchParams.get('folder_id')
  if (!folderId || !isValidUUID(folderId)) {
    return ApiResponse.badRequest('folder_id (uuid) 가 필요합니다')
  }

  const workspace = await getOrCreateWorkspace(supabase, user.id)

  const { data, error } = await supabase
    .from('processed_files')
    .select('id, drive_file_id, filename, mime_type, parsing_completed_at, parsing_error, atom_count, relation_count, updated_at')
    .eq('workspace_id', workspace.id)
    .eq('folder_id', folderId)
    .order('updated_at', { ascending: false })

  if (error) return ApiResponse.internalError(error.message)
  return ApiResponse.ok({ files: data ?? [] })
}
