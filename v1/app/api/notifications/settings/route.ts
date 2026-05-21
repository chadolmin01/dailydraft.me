import { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

export const runtime = 'nodejs'

// 기본 알림 설정
const DEFAULT_SETTINGS = {
  email_enabled: true,
  email_deadline_days: 3,
  inapp_deadline: true,
  inapp_new_match: true,
  inapp_bookmark_reminder: true,
  preferred_time: '09:00',
}

/**
 * GET /api/notifications/settings
 * 현재 사용자의 알림 설정 조회
 */
export const GET = withErrorCapture(async () => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return ApiResponse.unauthorized()
  }

  const { data: settings, error } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    return ApiResponse.internalError('알림 설정 조회에 실패했습니다')
  }

  // 설정이 없으면 기본값 반환
  if (!settings) {
    return ApiResponse.ok({
      ...DEFAULT_SETTINGS,
      user_id: user.id,
      is_default: true,
    })
  }

  return ApiResponse.ok(settings)
})

/**
 * POST /api/notifications/settings
 * 알림 설정 생성 또는 업데이트
 */
export const POST = withErrorCapture(async (request: NextRequest) => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return ApiResponse.unauthorized()
  }

  const body = await request.json()

  // 허용된 필드만 추출
  const allowedFields = [
    'email_enabled',
    'email_deadline_days',
    'inapp_deadline',
    'inapp_new_match',
    'inapp_bookmark_reminder',
    'preferred_time',
  ]

  const updateData: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field]
    }
  }

  // email_deadline_days 유효성 검사
  if (updateData.email_deadline_days) {
    const validDays = [1, 3, 7]
    const days = updateData.email_deadline_days as number
    if (!validDays.includes(days)) {
      updateData.email_deadline_days = 3
    }
  }

  // upsert: 없으면 생성, 있으면 업데이트
  const { data, error } = await supabase.from('notification_settings').upsert(
      {
        user_id: user.id,
        ...updateData,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()
    .single()

  if (error) {
    return ApiResponse.internalError('알림 설정 저장에 실패했습니다')
  }

  return ApiResponse.ok(data)
})
