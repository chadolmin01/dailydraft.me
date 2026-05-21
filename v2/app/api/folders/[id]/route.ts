import { type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { ApiResponse, isValidUUID } from '@/src/lib/api-utils'

interface PatchBody {
  name?: string
  sheet_id?: string | null
  program?: string | null
  program_start_date?: string | null
}

// PATCH /api/folders/[id]
//   - 폴더 설정 부분 수정 (이름·시트·program·시작일).
//   - drive_folder_id 는 변경 불가 (다른 폴더가 됨 — 삭제 후 재생성).

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  if (!isValidUUID(id)) return ApiResponse.badRequest('잘못된 폴더 ID')

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = (await request.json().catch(() => ({}))) as PatchBody
  const updates: Record<string, string | null> = {}
  if (typeof body.name === 'string') {
    const n = body.name.trim()
    if (!n) return ApiResponse.badRequest('이름은 비울 수 없습니다')
    updates.name = n
  }
  if (body.sheet_id !== undefined) {
    const v = body.sheet_id?.trim() || null
    updates.sheet_id = v
  }
  if (body.program !== undefined) {
    const v = body.program?.trim() || null
    updates.program = v
  }
  if (body.program_start_date !== undefined) {
    const v = body.program_start_date?.trim() || null
    updates.program_start_date = v
  }

  if (Object.keys(updates).length === 0) {
    return ApiResponse.badRequest('수정할 필드가 없습니다')
  }

  const { data: updated, error } = await supabase
    .from('folders')
    .update(updates)
    .eq('id', id)
    .select('id, name, drive_folder_id, sheet_id, program, program_start_date, created_at')
    .single()

  if (error) return ApiResponse.internalError(error.message)
  if (!updated) return ApiResponse.notFound('폴더를 찾을 수 없습니다')

  return ApiResponse.ok(updated)
}

// DELETE /api/folders/[id]
//   - Draft 의 폴더 연결만 해제 (Drive 폴더 자체는 건드리지 않음)
//   - RLS 가 본인 워크스페이스의 폴더만 삭제하도록 보장
//   - 연결된 chats 는 ON DELETE SET NULL 로 folder_id 만 null 처리 (대화 기록 보존)

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  if (!isValidUUID(id)) return ApiResponse.badRequest('잘못된 폴더 ID')

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', id)

  if (error) return ApiResponse.internalError(error.message)

  return ApiResponse.noContent()
}
