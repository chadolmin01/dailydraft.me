import { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

// GET: 특정 이벤트의 북마크 상태 확인
export const GET = withErrorCapture(async (
  request,
  { params }: { params: Promise<{ eventId: string }> }
) => {
    const { eventId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return ApiResponse.unauthorized()
    }

    const { data: bookmark } = await supabase
      .from('event_bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .single()

    return ApiResponse.ok({
      bookmarked: !!bookmark,
      bookmark,
    })
})

// PATCH: 북마크 알림 설정 수정
export const PATCH = withErrorCapture(async (
  request,
  { params }: { params: Promise<{ eventId: string }> }
) => {
    const { eventId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return ApiResponse.unauthorized()
    }

    const body = await request.json()
    const { notify_before_days } = body

    if (notify_before_days === undefined) {
      return ApiResponse.badRequest('알림 일수를 지정해주세요')
    }

    const { data: bookmark, error } = await supabase.from('event_bookmarks')
      .update({ notify_before_days })
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .select()
      .single()

    if (error) {
      return ApiResponse.internalError()
    }

    return ApiResponse.ok(bookmark)
})

// DELETE: 북마크 삭제
export const DELETE = withErrorCapture(async (
  request,
  { params }: { params: Promise<{ eventId: string }> }
) => {
    const { eventId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return ApiResponse.unauthorized()
    }

    const { error } = await supabase
      .from('event_bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('event_id', eventId)

    if (error) {
      return ApiResponse.internalError()
    }

    return ApiResponse.ok({ success: true })
})
