import { type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { ApiResponse, isValidUUID } from '@/src/lib/api-utils'

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
