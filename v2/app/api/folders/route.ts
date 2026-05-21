import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { getOrCreateWorkspace } from '@/src/lib/workspace'
import { getValidAccessToken } from '@/src/lib/google/tokens'
import { getFolderMeta } from '@/src/lib/google/drive'

interface CreateFolderBody {
  name?: string
  drive_folder_id?: string
  sheet_id?: string
  program?: string
}

// GET /api/folders — 매니저의 워크스페이스에 속한 모든 폴더 목록
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const workspace = await getOrCreateWorkspace(supabase, user.id)

  const { data: folders, error } = await supabase
    .from('folders')
    .select('id, name, drive_folder_id, sheet_id, program, created_at')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: true })

  if (error) return ApiResponse.internalError(error.message)

  return ApiResponse.ok({ workspace, folders: folders ?? [] })
}

// POST /api/folders — Drive 폴더 ID + (선택) Sheet ID 로 폴더 생성
//
// 입력값 검증:
//   - drive_folder_id 가 실제 Drive 에 존재하고 접근 권한 있는지 한번 확인
//     (잘못된 ID 면 매트릭스 계산 단계까지 가서야 발견되는 걸 사전 차단)
//   - sheet_id 는 선택 (없어도 생성 가능, 추후 연결)
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = (await request.json().catch(() => ({}))) as CreateFolderBody
  const name = body.name?.trim()
  const driveFolderId = body.drive_folder_id?.trim()

  if (!name || !driveFolderId) {
    return ApiResponse.badRequest('name 과 drive_folder_id 는 필수입니다')
  }

  // Drive 접근 검증
  try {
    const accessToken = await getValidAccessToken(user.id)
    const meta = await getFolderMeta(accessToken, driveFolderId)
    if (meta.mimeType !== 'application/vnd.google-apps.folder') {
      return ApiResponse.badRequest('해당 ID 는 폴더가 아닙니다')
    }
  } catch (e) {
    return ApiResponse.badRequest(`Drive 폴더 확인 실패: ${(e as Error).message}`)
  }

  const workspace = await getOrCreateWorkspace(supabase, user.id)

  const { data: created, error } = await supabase
    .from('folders')
    .insert({
      workspace_id: workspace.id,
      name,
      drive_folder_id: driveFolderId,
      sheet_id: body.sheet_id?.trim() || null,
      program: body.program?.trim() || null,
    })
    .select('id, name, drive_folder_id, sheet_id, program, created_at')
    .single()

  if (error) return ApiResponse.internalError(error.message)

  return ApiResponse.created(created)
}
