import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse, isValidUUID, parseJsonBody } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

type RouteParams = { params: Promise<{ slug: string; channelId: string }> }

/** PATCH: 알림 채널 수정 (활성/비활성, 이벤트 타입 변경) */
export const PATCH = withErrorCapture(async (request, { params }: RouteParams) => {
  const { slug: clubId, channelId } = await params
  if (!isValidUUID(clubId) || !isValidUUID(channelId)) {
    return ApiResponse.badRequest('유효하지 않은 ID입니다')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = await parseJsonBody<{
    enabled?: boolean
    label?: string
    event_types?: string[]
  }>(request)
  if (body instanceof Response) return body

  const updates: Record<string, unknown> = {}
  if (body.enabled !== undefined) updates.enabled = body.enabled
  if (body.label !== undefined) updates.label = body.label.trim()
  if (body.event_types !== undefined) updates.event_types = body.event_types

  if (Object.keys(updates).length === 0) {
    return ApiResponse.badRequest('수정할 내용이 없습니다')
  }

  const { data, error } = await supabase
    .from('club_notification_channels')
    .update(updates)
    .eq('id', channelId)
    .eq('club_id', clubId)
    .select('id, channel_type, label, event_types, enabled, created_at')
    .single()

  if (error) return ApiResponse.internalError('채널 수정에 실패했습니다')
  if (!data) return ApiResponse.notFound('채널을 찾을 수 없습니다')

  return ApiResponse.ok(data)
})

/** DELETE: 알림 채널 삭제 */
export const DELETE = withErrorCapture(async (_request, { params }: RouteParams) => {
  const { slug: clubId, channelId } = await params
  if (!isValidUUID(clubId) || !isValidUUID(channelId)) {
    return ApiResponse.badRequest('유효하지 않은 ID입니다')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const { error } = await supabase
    .from('club_notification_channels')
    .delete()
    .eq('id', channelId)
    .eq('club_id', clubId)

  if (error) return ApiResponse.internalError('채널 삭제에 실패했습니다')

  return ApiResponse.ok({ deleted: true })
})
