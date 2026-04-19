import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { applyRateLimit, getClientIp } from '@/src/lib/rate-limit'
import { writeAuditLog, extractAuditContext } from '@/src/lib/audit'

/**
 * DELETE /api/me/account — 회원 탈퇴 (PIPA 36조 삭제권).
 *
 * 동작:
 * 1. profiles.deleted_at = now() 로 soft delete 마킹 (30일 유예)
 * 2. 감사 로그 기록 (PIPA 증빙)
 * 3. 별도 크론이 30일 후 hard delete (auth.users + cascade)
 *
 * Body: { confirm: true, reason?: string }
 *
 * 복구:
 * - 30일 내 재로그인 + 복구 요청 → deleted_at = null (별도 API)
 * - 30일 경과 → 복구 불가
 */
export const DELETE = withErrorCapture(async (request) => {
  // 탈퇴 요청은 쉽게 반복 호출되지 않아야 함 — 실수/악의 탈퇴 방어
  const rateLimitResponse = applyRateLimit(null, getClientIp(request))
  if (rateLimitResponse) return rateLimitResponse

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = await request.json().catch(() => ({}))
  if (body.confirm !== true) {
    return ApiResponse.badRequest('탈퇴를 확인하려면 confirm: true 를 전달해주세요')
  }

  // 현재 상태 조회 — 이미 탈퇴 중이면 다시 찍지 않음
  const { data: existing } = await supabase
    .from('profiles')
    .select('deleted_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing?.deleted_at) {
    return ApiResponse.ok({
      message: '이미 탈퇴 요청이 접수되었습니다',
      deleted_at: existing.deleted_at,
    })
  }

  const now = new Date().toISOString()

  // soft delete — RLS 내 본인 업데이트 정책으로 처리
  const { error } = await supabase
    .from('profiles')
    .update({ deleted_at: now } as never)
    .eq('user_id', user.id)

  if (error) {
    return ApiResponse.internalError('탈퇴 처리에 실패했습니다', error.message)
  }

  // 어드민 클라이언트로 auth 세션 invalidate (선택).
  // 유저 재로그인 시엔 deleted_at 확인 후 "복구하시겠습니까?" UI.
  const admin = createAdminClient()
  admin.auth.admin.signOut(user.id).catch(() => {})

  // PIPA 증빙: 삭제 요청 기록
  writeAuditLog(supabase, {
    actorUserId: user.id,
    action: 'profile.delete_request',
    targetType: 'profile',
    targetId: user.id,
    diff: { before: { deleted_at: null }, after: { deleted_at: now } },
    context: extractAuditContext(request, {
      reason: typeof body.reason === 'string' ? body.reason.slice(0, 500) : null,
      grace_period_days: 30,
    }),
  })

  return ApiResponse.ok({
    message: '탈퇴 요청이 접수되었습니다. 30일 이내 복구 가능합니다.',
    deleted_at: now,
    permanent_deletion_scheduled_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  })
})
