import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse, validateRequired } from '@/src/lib/api-utils'
import { logError } from '@/src/lib/error-logging'

// POST: Redeem invite code (authenticated users)
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    const body = await request.json()
    const validation = validateRequired(body, ['code'])

    if (!validation.valid) {
      return ApiResponse.badRequest(`필수 항목이 누락되었습니다: ${validation.missing.join(', ')}`)
    }

    const { code } = body
    const normalizedCode = code.toUpperCase().trim()

    // Validate code format (8 alphanumeric characters)
    if (!/^[A-Z0-9]{8}$/.test(normalizedCode)) {
      return ApiResponse.badRequest('유효하지 않은 코드 형식입니다')
    }

    // Check user's current premium status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_premium, onboarding_completed')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      return ApiResponse.internalError('프로필 조회 중 오류가 발생했습니다', profileError.message)
    }

    if (profile?.is_premium) {
      return ApiResponse.badRequest('이미 프리미엄 사용자입니다')
    }

    // Find the invite code
    const { data: inviteCode, error: codeError } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', normalizedCode)
      .single()

    if (codeError || !inviteCode) {
      return ApiResponse.notFound('유효하지 않은 초대 코드입니다')
    }

    // Check if code is active
    if (!inviteCode.is_active) {
      return ApiResponse.badRequest('비활성화된 초대 코드입니다')
    }

    // Check if code is already used
    if (inviteCode.used_by) {
      return ApiResponse.badRequest('이미 사용된 초대 코드입니다')
    }

    // Check if code is expired
    if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
      return ApiResponse.badRequest('만료된 초대 코드입니다')
    }

    const now = new Date().toISOString()

    // Update invite code as used
    const { error: updateCodeError } = await supabase
      .from('invite_codes')
      .update({
        used_by: user.id,
        used_at: now,
        is_active: false,
      })
      .eq('id', inviteCode.id)

    if (updateCodeError) {
      return ApiResponse.internalError('초대 코드 사용 처리 중 오류가 발생했습니다', updateCodeError.message)
    }

    // Update user profile to premium
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({
        is_premium: true,
        premium_activated_at: now,
        invite_code_used: normalizedCode,
      })
      .eq('user_id', user.id)

    if (updateProfileError) {
      // Rollback invite code usage
      await supabase
        .from('invite_codes')
        .update({
          used_by: null,
          used_at: null,
          is_active: true,
        })
        .eq('id', inviteCode.id)

      return ApiResponse.internalError('프리미엄 활성화 중 오류가 발생했습니다', updateProfileError.message)
    }

    return ApiResponse.ok({
      success: true,
      message: '프리미엄이 활성화되었습니다!',
      premium_activated_at: now,
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    await logError({
      level: 'error',
      source: 'api',
      errorCode: err.name,
      message: err.message,
      stackTrace: err.stack,
      endpoint: '/api/invite-codes/redeem',
      method: 'POST',
    })
    return ApiResponse.internalError('초대 코드 사용 중 오류가 발생했습니다', err.message)
  }
}
