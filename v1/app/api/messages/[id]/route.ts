import { createClient } from '@/src/lib/supabase/server'
import { NextRequest } from 'next/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

// PATCH: 읽음 처리 또는 삭제
export const PATCH = withErrorCapture(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = await request.json()
  const { action } = body as { action: 'read' | 'delete' }

  if (action === 'read') {
    const { error } = await supabase
      .from('direct_messages')
      .update({ is_read: true, read_at: new Date().toISOString() } as never)
      .eq('id', id)
      .eq('receiver_id', user.id)

    if (error) throw error
    return ApiResponse.ok({ success: true })
  }

  if (action === 'delete') {
    // 보낸 사람이면 deleted_by_sender, 받은 사람이면 deleted_by_receiver
    const { data: msg } = await supabase
      .from('direct_messages')
      .select('sender_id, receiver_id')
      .eq('id', id)
      .single()

    if (!msg) return ApiResponse.notFound('쪽지를 찾을 수 없습니다')

    const typedMsg = msg as { sender_id: string; receiver_id: string }
    const updateField = typedMsg.sender_id === user.id
      ? { deleted_by_sender: true }
      : typedMsg.receiver_id === user.id
        ? { deleted_by_receiver: true }
        : null

    if (!updateField) return ApiResponse.forbidden()

    const { error } = await supabase
      .from('direct_messages')
      .update(updateField as never)
      .eq('id', id)

    if (error) throw error
    return ApiResponse.ok({ success: true })
  }

  return ApiResponse.badRequest('잘못된 요청입니다')
})
