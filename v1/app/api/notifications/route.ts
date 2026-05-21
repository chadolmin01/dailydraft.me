import { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

// GET: 내 알림 목록
export const GET = withErrorCapture(async (request: NextRequest) => {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return ApiResponse.unauthorized()
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'unread', 'read', 'all'
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabase
      .from('event_notifications')
      .select(`
        *,
        startup_events (
          id, title, organizer, event_type,
          registration_end_date, registration_url
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: notifications, error } = await query

    if (error) {
      return ApiResponse.internalError('알림 조회 중 오류가 발생했습니다')
    }

    // 메인 쿼리 결과에서 unread 카운트 계산 (별도 DB 호출 제거)
    const unreadCount = (notifications || []).filter(n => n.status === 'unread').length

    return ApiResponse.ok({
      notifications,
      unread_count: unreadCount,
    })
})

// PATCH: 알림 일괄 업데이트 (모두 읽음 처리)
export const PATCH = withErrorCapture(async (request: NextRequest) => {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return ApiResponse.unauthorized()
    }

    const body = await request.json()
    const { action } = body // 'mark_all_read'

    if (action === 'mark_all_read') {
      const { error } = await supabase.from('event_notifications')
        .update({
          status: 'read',
          read_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('status', 'unread')

      if (error) {
        return ApiResponse.internalError('알림 읽음 처리에 실패했습니다')
      }

      return ApiResponse.ok({ success: true })
    }

    return ApiResponse.badRequest('올바르지 않은 요청입니다')
})
