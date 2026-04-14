import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse, isValidUUID, parseJsonBody } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

async function getUpdateAndVerifyOwner(updateId: string, userId: string) {
  const supabase = await createClient()

  const { data: update, error } = await supabase
    .from('project_updates')
    .select('id, author_id, opportunity_id')
    .eq('id', updateId)
    .single()

  if (error || !update) return { error: ApiResponse.notFound('업데이트를 찾을 수 없습니다') }
  if (update.author_id !== userId) return { error: ApiResponse.forbidden('수정 권한이 없습니다') }

  return { update, supabase }
}

export const PATCH = withErrorCapture(async (
  request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params

  if (!isValidUUID(id)) return ApiResponse.badRequest('유효하지 않은 ID입니다')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const { update, error: ownerError, supabase: db } = await getUpdateAndVerifyOwner(id, user.id)
  if (ownerError) return ownerError

  const body = await parseJsonBody<{
    title?: string
    content?: string
    update_type?: string
    week_number?: number
  }>(request)
  if (body instanceof Response) return body

  const { title, content, update_type, week_number } = body

  if (update_type && !['ideation', 'design', 'development', 'launch', 'general'].includes(update_type)) {
    return ApiResponse.badRequest('유효하지 않은 업데이트 유형입니다')
  }

  // week_number 변경 차단: 주차 변경 시 다른 주차와 충돌 가능
  // 주차를 바꾸고 싶으면 기존 삭제 후 새로 작성해야 함
  if (week_number !== undefined) {
    return ApiResponse.badRequest('주차 번호는 변경할 수 없습니다. 삭제 후 다시 작성해주세요.')
  }

  const updatePayload: Record<string, unknown> = {}
  if (title?.trim()) updatePayload.title = title.trim()
  if (content?.trim()) updatePayload.content = content.trim()
  if (update_type) updatePayload.update_type = update_type

  const { data, error } = await db!
    .from('project_updates')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (error) return ApiResponse.internalError('업데이트 수정에 실패했습니다')

  return ApiResponse.ok(data)
})

export const DELETE = withErrorCapture(async (
  _request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params

  if (!isValidUUID(id)) return ApiResponse.badRequest('유효하지 않은 ID입니다')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const { error: ownerError, supabase: db } = await getUpdateAndVerifyOwner(id, user.id)
  if (ownerError) return ownerError

  const { error } = await db!
    .from('project_updates')
    .delete()
    .eq('id', id)

  if (error) return ApiResponse.internalError('업데이트 삭제에 실패했습니다')

  return ApiResponse.ok({ id })
})
