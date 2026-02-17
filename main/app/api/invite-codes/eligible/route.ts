import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { logError } from '@/src/lib/error-logging'

// GET: Get eligible users for invite codes (admin only)
// Eligible = onboarding_completed = true AND is_premium = false
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    // Check if user is admin
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single()

    if (!adminProfile?.is_admin) {
      return ApiResponse.forbidden('관리자만 접근할 수 있습니다')
    }

    // Get eligible users
    const { data: eligibleProfiles, error } = await supabase
      .from('profiles')
      .select(`
        user_id,
        nickname,
        contact_email,
        onboarding_completed,
        is_premium,
        created_at
      `)
      .eq('onboarding_completed', true)
      .or('is_premium.is.null,is_premium.eq.false')
      .order('created_at', { ascending: false })

    if (error) {
      return ApiResponse.internalError('사용자 조회 중 오류가 발생했습니다', error.message)
    }

    // Get auth emails for users without contact_email
    const usersWithoutContactEmail = eligibleProfiles?.filter(p => !p.contact_email) || []

    let authEmails: Record<string, string> = {}
    if (usersWithoutContactEmail.length > 0) {
      const userIds = usersWithoutContactEmail.map(p => p.user_id)
      const { data: users } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds)

      if (users) {
        authEmails = users.reduce((acc, u) => {
          acc[u.id] = u.email
          return acc
        }, {} as Record<string, string>)
      }
    }

    // Check for existing invite codes for these users
    const emails = eligibleProfiles?.map(p => p.contact_email || authEmails[p.user_id]).filter(Boolean) || []

    let existingCodes: Record<string, { code: string; used: boolean; expired: boolean }> = {}
    if (emails.length > 0) {
      const { data: codes } = await supabase
        .from('invite_codes')
        .select('recipient_email, code, used_by, expires_at, is_active')
        .in('recipient_email', emails)

      if (codes) {
        const now = new Date()
        existingCodes = codes.reduce((acc, c) => {
          if (c.recipient_email) {
            acc[c.recipient_email] = {
              code: c.code,
              used: !!c.used_by,
              expired: c.expires_at ? new Date(c.expires_at) < now : false,
            }
          }
          return acc
        }, {} as Record<string, { code: string; used: boolean; expired: boolean }>)
      }
    }

    // Combine data
    const result = eligibleProfiles?.map(profile => {
      const email = profile.contact_email || authEmails[profile.user_id]
      const existingCode = email ? existingCodes[email] : null

      return {
        user_id: profile.user_id,
        nickname: profile.nickname,
        email,
        created_at: profile.created_at,
        existing_invite_code: existingCode?.code || null,
        invite_code_used: existingCode?.used || false,
        invite_code_expired: existingCode?.expired || false,
      }
    }) || []

    // Filter out users who already have unused, non-expired invite codes
    const eligibleForNewCode = result.filter(
      u => !u.existing_invite_code || u.invite_code_used || u.invite_code_expired
    )

    return ApiResponse.ok({
      all: result,
      eligible_for_new_code: eligibleForNewCode,
      total_count: result.length,
      eligible_count: eligibleForNewCode.length,
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    await logError({
      level: 'error',
      source: 'api',
      errorCode: err.name,
      message: err.message,
      stackTrace: err.stack,
      endpoint: '/api/invite-codes/eligible',
      method: 'GET',
    })
    return ApiResponse.internalError('사용자 조회 중 오류가 발생했습니다', err.message)
  }
}
