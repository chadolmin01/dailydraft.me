import { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

export const runtime = 'nodejs'

/**
 * 유저 알림·이메일 수신 설정.
 *
 * notification_settings 테이블에 유저 선호 저장. RLS 로 본인만 접근 (기존 정책 전제).
 * 레코드 없으면 기본값 on 으로 간주.
 */

type PatchPayload = {
  email_enabled?: boolean
  email_deadline_days?: number
  inapp_bookmark_reminder?: boolean
  inapp_deadline?: boolean
  inapp_new_match?: boolean
  preferred_time?: string | null
}

export const GET = withErrorCapture(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const { data, error } = await supabase
    .from('notification_settings')
    .select('email_enabled, email_deadline_days, inapp_bookmark_reminder, inapp_deadline, inapp_new_match, preferred_time')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return ApiResponse.internalError('설정 조회 실패', error.message)

  return ApiResponse.ok({
    email_enabled: data?.email_enabled ?? true,
    email_deadline_days: data?.email_deadline_days ?? 3,
    inapp_bookmark_reminder: data?.inapp_bookmark_reminder ?? true,
    inapp_deadline: data?.inapp_deadline ?? true,
    inapp_new_match: data?.inapp_new_match ?? true,
    preferred_time: data?.preferred_time ?? null,
  })
})

export const PATCH = withErrorCapture(async (request: NextRequest) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = (await request.json().catch(() => ({}))) as PatchPayload

  const update: Record<string, unknown> = { user_id: user.id, updated_at: new Date().toISOString() }
  if (typeof body.email_enabled === 'boolean') update.email_enabled = body.email_enabled
  if (typeof body.email_deadline_days === 'number' && body.email_deadline_days >= 0 && body.email_deadline_days <= 30) {
    update.email_deadline_days = body.email_deadline_days
  }
  if (typeof body.inapp_bookmark_reminder === 'boolean') update.inapp_bookmark_reminder = body.inapp_bookmark_reminder
  if (typeof body.inapp_deadline === 'boolean') update.inapp_deadline = body.inapp_deadline
  if (typeof body.inapp_new_match === 'boolean') update.inapp_new_match = body.inapp_new_match
  if (typeof body.preferred_time === 'string' || body.preferred_time === null) update.preferred_time = body.preferred_time

  const { error } = await supabase
    .from('notification_settings')
    .upsert(update as never, { onConflict: 'user_id' })

  if (error) return ApiResponse.internalError('설정 저장 실패', error.message)
  return ApiResponse.ok({ success: true })
})
