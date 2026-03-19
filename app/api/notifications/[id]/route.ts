import { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'

// PATCH: 개별 알림 상태 업데이트
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return ApiResponse.unauthorized()
    }

    const body = await request.json()
    const { status } = body

    if (!status || !['read', 'dismissed'].includes(status)) {
      return ApiResponse.badRequest('올바르지 않은 상태값입니다')
    }

    const updateData: { status: string; read_at?: string } = { status }
    if (status === 'read') {
      updateData.read_at = new Date().toISOString()
    }

    const { data: notification, error } = await supabase.from('event_notifications')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return ApiResponse.internalError('알림 상태 변경에 실패했습니다')
    }

    return ApiResponse.ok(notification)
  } catch {
    return ApiResponse.internalError('알림 업데이트 중 오류가 발생했습니다')
  }
}

// DELETE: 알림 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return ApiResponse.unauthorized()
    }

    const { error } = await supabase
      .from('event_notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return ApiResponse.internalError('알림 삭제에 실패했습니다')
    }

    return ApiResponse.ok({ success: true })
  } catch {
    return ApiResponse.internalError('알림 삭제 중 오류가 발생했습니다')
  }
}
