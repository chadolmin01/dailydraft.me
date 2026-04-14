import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { provisionTeamChannels } from '@/src/lib/discord/provision'

/**
 * POST /api/clubs/[slug]/teams/provision
 *
 * 프로젝트에 대한 Discord 팀 채널을 자동 프로비저닝
 * - 카테고리 + 채널 + Role 생성 + 권한 격리
 * - 클럽 admin/owner만 실행 가능
 */
export const POST = withErrorCapture(
  async (request, context) => {
    const { slug } = await context.params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    const body = await request.json()
    const { opportunityId } = body

    if (!opportunityId) {
      return ApiResponse.badRequest('opportunityId가 필요합니다')
    }

    const admin = createAdminClient()

    // 1. 클럽 확인 + admin 권한 체크
    const { data: club } = await admin
      .from('clubs')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!club) return ApiResponse.notFound('클럽을 찾을 수 없습니다')

    const { data: membership } = await admin
      .from('club_members')
      .select('role')
      .eq('club_id', club.id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return ApiResponse.forbidden('관리자만 프로비저닝할 수 있습니다')
    }

    // 2. 프로젝트 확인 (클럽 소속인지)
    const { data: opportunity } = await admin
      .from('opportunities')
      .select('id, title, club_id')
      .eq('id', opportunityId)
      .maybeSingle()

    if (!opportunity || opportunity.club_id !== club.id) {
      return ApiResponse.badRequest('해당 클럽에 속한 프로젝트가 아닙니다')
    }

    // 3. 이미 프로비저닝되었는지 확인
    const { data: existing } = await admin
      .from('discord_team_channels')
      .select('id')
      .eq('opportunity_id', opportunityId)
      .maybeSingle()

    if (existing) {
      return ApiResponse.badRequest('이미 Discord 채널이 생성된 프로젝트입니다')
    }

    // 4. Discord 봇 설치 정보 확인
    const { data: installation } = await admin
      .from('discord_bot_installations')
      .select('discord_guild_id')
      .eq('club_id', club.id)
      .maybeSingle()

    if (!installation) {
      return ApiResponse.badRequest('Discord 봇이 설치되지 않았습니다. 먼저 봇을 설치해주세요.')
    }

    // 5. 팀원들의 Discord ID 수집 (선택적 — 연동한 사람만)
    const { data: connections } = await admin
      .from('accepted_connections')
      .select('applicant_id')
      .eq('opportunity_id', opportunityId)
      .eq('status', 'active')

    const memberUserIds = [
      opportunity.club_id, // creator는 별도로 가져와야 함
      ...(connections || []).map(c => c.applicant_id),
    ]

    // creator_id 조회
    const { data: oppFull } = await admin
      .from('opportunities')
      .select('creator_id')
      .eq('id', opportunityId)
      .single()

    if (oppFull) {
      memberUserIds.push(oppFull.creator_id)
    }

    const uniqueUserIds = [...new Set(memberUserIds.filter(Boolean))]

    // Discord 연동된 유저들의 discord_user_id 조회
    const { data: profiles } = await admin
      .from('profiles')
      .select('discord_user_id')
      .in('user_id', uniqueUserIds)
      .not('discord_user_id', 'is', null)

    const discordIds = (profiles || [])
      .map(p => p.discord_user_id)
      .filter(Boolean) as string[]

    // 6. 프로비저닝 실행
    try {
      const result = await provisionTeamChannels(
        installation.discord_guild_id,
        opportunity.title,
        opportunityId,
        club.id,
        user.id,
        discordIds
      )

      return ApiResponse.ok({
        message: `${opportunity.title} 팀 채널이 생성되었습니다`,
        categoryId: result.categoryId,
        roleId: result.roleId,
        channels: result.channels,
      })
    } catch (error) {
      console.error('[provision API] 프로비저닝 실패:', error)
      return ApiResponse.internalError(
        `Discord 채널 생성에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      )
    }
  }
)
