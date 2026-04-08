import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse, validateRequired } from '@/src/lib/api-utils'
import { sendInviteCodeEmail } from '@/src/lib/email/client'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import type { NextRequest } from 'next/server'

// Generate random 8-character code (uppercase letters + numbers)
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => chars[b % chars.length]).join('')
}

// GET: List invite codes (admin only)
export const GET = withErrorCapture(async () => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return ApiResponse.unauthorized()
  }

  // Check if user is admin (from JWT app_metadata — consistent with client useAdmin hook)
  if (user.app_metadata?.is_admin !== true) {
    return ApiResponse.forbidden('관리자만 접근할 수 있습니다')
  }

  // Get all invite codes
  const { data: codes, error } = await supabase
    .from('invite_codes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return ApiResponse.internalError('초대 코드 조회 중 오류가 발생했습니다')
  }

  return ApiResponse.ok(codes || [])
})

// POST: Create invite code and send email (admin only)
export const POST = withErrorCapture(async (request: NextRequest) => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return ApiResponse.unauthorized()
  }

  // Check if user is admin (from JWT app_metadata — consistent with GET/DELETE)
  if (user.app_metadata?.is_admin !== true) {
    return ApiResponse.forbidden('관리자만 접근할 수 있습니다')
  }

  const body = await request.json()
  const validation = validateRequired(body, ['email'])

  if (!validation.valid) {
    return ApiResponse.badRequest(`필수 항목이 누락되었습니다: ${validation.missing.join(', ')}`)
  }

  const { email } = body

  // Check if recipient exists and has completed onboarding
  const { data: recipientProfile } = await supabase
    .from('profiles')
    .select('user_id, nickname, onboarding_completed, is_premium')
    .eq('contact_email', email)
    .single()

  if (!recipientProfile) {
    // Try to find by auth email
    const { data: authUsers } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', email)
      .single()

    if (!authUsers) {
      return ApiResponse.notFound('해당 이메일의 사용자를 찾을 수 없습니다')
    }

    // Get profile by user_id
    const { data: profileByUserId } = await supabase
      .from('profiles')
      .select('user_id, nickname, onboarding_completed, is_premium')
      .eq('user_id', authUsers.id)
      .single()

    if (!profileByUserId) {
      return ApiResponse.notFound('사용자의 프로필을 찾을 수 없습니다')
    }

    if (!profileByUserId.onboarding_completed) {
      return ApiResponse.badRequest('온보딩을 완료하지 않은 사용자입니다')
    }

    if (profileByUserId.is_premium) {
      return ApiResponse.badRequest('이미 프리미엄 사용자입니다')
    }
  } else {
    if (!recipientProfile.onboarding_completed) {
      return ApiResponse.badRequest('온보딩을 완료하지 않은 사용자입니다')
    }

    if (recipientProfile.is_premium) {
      return ApiResponse.badRequest('이미 프리미엄 사용자입니다')
    }
  }

  // Generate unique code
  let code: string
  let attempts = 0
  const maxAttempts = 10

  do {
    code = generateInviteCode()
    const { data: existing } = await supabase
      .from('invite_codes')
      .select('id')
      .eq('code', code)
      .single()

    if (!existing) break
    attempts++
  } while (attempts < maxAttempts)

  if (attempts >= maxAttempts) {
    return ApiResponse.internalError('고유 코드 생성에 실패했습니다. 다시 시도해주세요.')
  }

  // Calculate expiration (30 days from now)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  // Create invite code
  const { data: inviteCode, error: createError } = await supabase
    .from('invite_codes')
    .insert({
      code,
      created_by: user.id,
      recipient_email: email,
      expires_at: expiresAt.toISOString(),
      is_active: true,
    })
    .select()
    .single()

  if (createError) {
    return ApiResponse.internalError('초대 코드 생성 중 오류가 발생했습니다')
  }

  // Get recipient name for email
  const recipientName = recipientProfile?.nickname || email.split('@')[0]

  // Send email
  const emailResult = await sendInviteCodeEmail({
    recipientEmail: email,
    recipientName,
    inviteCode: code,
    expiresAt: expiresAt.toISOString(),
  })

  return ApiResponse.created({
    ...inviteCode,
    emailSent: emailResult.success,
    emailError: emailResult.error,
  })
})

// DELETE: Deactivate invite code (admin only)
export const DELETE = withErrorCapture(async (request: NextRequest) => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return ApiResponse.unauthorized()
  }

  // Check if user is admin (from JWT app_metadata — consistent with client useAdmin hook)
  if (user.app_metadata?.is_admin !== true) {
    return ApiResponse.forbidden('관리자만 접근할 수 있습니다')
  }

  const { searchParams } = new URL(request.url)
  const codeId = searchParams.get('id')

  if (!codeId) {
    return ApiResponse.badRequest('초대 코드 ID가 필요합니다')
  }

  // Deactivate invite code
  const { error } = await supabase
    .from('invite_codes')
    .update({ is_active: false })
    .eq('id', codeId)

  if (error) {
    return ApiResponse.internalError('초대 코드 비활성화 중 오류가 발생했습니다')
  }

  return ApiResponse.ok({ message: '초대 코드가 비활성화되었습니다' })
})
