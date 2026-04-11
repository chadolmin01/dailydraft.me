import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { sendOnboardingDM } from '@/src/lib/discord/onboarding'

// POST /api/invite/redeem — 초대 코드 사용 (인증 유저)
// 코드를 사용해 클럽에 셀프 가입
export const POST = withErrorCapture(
  async (request) => {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    const body = await request.json()
    const code = body.code?.trim()

    if (!code) {
      return ApiResponse.badRequest('초대 코드를 입력해주세요')
    }

    // 1. 코드 조회 (service_role 불필요 — RLS bypass가 필요하므로 rpc 사용)
    // RLS에서 invite_codes는 admin만 SELECT 가능하므로,
    // redemption용 별도 함수를 사용하거나 코드 검증을 서버에서 처리
    // 여기서는 service_role 없이 할 수 있는 방법: DB function
    const { data: inviteCode, error: codeError } = await supabase
      .rpc('redeem_invite_code', {
        p_code: code,
        p_user_id: user.id,
      })

    if (codeError) {
      // rpc 에러 메시지를 사용자에게 전달
      const msg = codeError.message
      if (msg.includes('NOT_FOUND')) return ApiResponse.notFound('유효하지 않은 초대 코드입니다')
      if (msg.includes('EXPIRED')) return ApiResponse.badRequest('만료된 초대 코드입니다')
      if (msg.includes('MAX_USES')) return ApiResponse.badRequest('사용 횟수를 초과한 코드입니다')
      if (msg.includes('INACTIVE')) return ApiResponse.badRequest('비활성화된 초대 코드입니다')
      if (msg.includes('ALREADY_MEMBER')) return ApiResponse.badRequest('이미 이 클럽의 멤버입니다')
      return ApiResponse.internalError(codeError.message)
    }

    // 가입 성공 후 온보딩 DM 발송 (fire-and-forget)
    try {
      const admin = createAdminClient()
      const { data: profile } = await admin
        .from('profiles')
        .select('discord_user_id, nickname')
        .eq('user_id', user.id)
        .single()

      const discordUserId = (profile as { discord_user_id?: string; nickname?: string } | null)?.discord_user_id
      const memberName = (profile as { nickname?: string } | null)?.nickname || '멤버'

      if (discordUserId) {
        // inviteCode에서 클럽 정보 추출
        const result = inviteCode as { club_name?: string; role?: string } | null
        sendOnboardingDM(
          discordUserId,
          memberName,
          result?.club_name || '동아리',
          result?.role
        ).catch(() => {})
      }
    } catch {
      // 온보딩 DM 실패해도 가입은 성공
    }

    return ApiResponse.ok(inviteCode)
  }
)

// GET /api/invite?code=XXX — 코드 미리보기 (비로그인도 가능)
// 초대 링크 클릭 시 "FLIP 3기에 초대되었습니다" 표시용
export const GET = withErrorCapture(
  async (request) => {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')?.trim()

    if (!code) {
      return ApiResponse.badRequest('코드가 필요합니다')
    }

    // 미리보기는 클럽 이름/기수만 반환 (코드 상세는 노출 안 함)
    const { data, error } = await supabase
      .rpc('preview_invite_code', { p_code: code })

    if (error) {
      if (error.message.includes('NOT_FOUND')) {
        return ApiResponse.notFound('유효하지 않은 초대 코드입니다')
      }
      return ApiResponse.internalError(error.message)
    }

    return ApiResponse.ok(data)
  }
)
