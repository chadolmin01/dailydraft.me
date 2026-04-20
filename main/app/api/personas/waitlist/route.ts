/**
 * POST /api/personas/waitlist
 *
 * 개인 페르소나 출시 waitlist 등록.
 * 본인 user_id + 유저가 입력한 이메일 (default = auth.users.email) 저장.
 *
 * 중복 등록은 409 — UI 에서 "이미 신청되어 있습니다" 표시.
 */

import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

export const POST = withErrorCapture(async (request) => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = await request.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim() : user.email

  if (!email || !email.includes('@')) {
    return ApiResponse.badRequest('유효한 이메일이 필요합니다')
  }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from('persona_personal_waitlist' as never) as any).insert({
    user_id: user.id,
    email,
    source: 'profile_persona_teaser',
  })

  if (error) {
    if (error.code === '23505') {
      // unique violation — 이미 등록됨
      return ApiResponse.ok({ already_registered: true })
    }
    return ApiResponse.internalError('waitlist 등록 실패', error)
  }

  return ApiResponse.created({ already_registered: false })
})

export const GET = withErrorCapture(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin.from('persona_personal_waitlist' as never) as any)
    .select('id, email, created_at')
    .eq('user_id', user.id)
    .maybeSingle()

  return ApiResponse.ok({ registered: !!data, entry: data ?? null })
})
