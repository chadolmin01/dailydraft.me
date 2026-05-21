/**
 * POST /api/discord/connect
 *
 * pending_discord_setups → discord_bot_installations + club_ghostwriter_settings 변환
 * Discord 로그인한 유저가 클럽을 선택하면 연결 완료
 *
 * body: { guild_id: string, club_id: string }
 */

import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse, parseJsonBody, isValidUUID } from '@/src/lib/api-utils'
import { provisionClubServer } from '@/src/lib/discord/provision-club'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = await parseJsonBody<{ guild_id: string; club_id: string }>(request)
  if (body instanceof Response) return body

  if (!body.guild_id?.trim()) return ApiResponse.badRequest('guild_id는 필수입니다')
  if (!body.club_id?.trim() || !isValidUUID(body.club_id)) return ApiResponse.badRequest('유효하지 않은 club_id입니다')

  const admin = createAdminClient()

  // 1. 유저가 해당 클럽의 owner/admin인지 확인
  const { data: membership } = await admin
    .from('club_members')
    .select('role')
    .eq('club_id', body.club_id)
    .eq('user_id', user.id)
    .single()

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return ApiResponse.forbidden('클럽 관리자만 Discord를 연결할 수 있습니다')
  }

  // 2. pending_discord_setups에서 해당 guild 조회
  const { data: pending } = await admin
    .from('pending_discord_setups' as any)
    .select('*')
    .eq('discord_guild_id', body.guild_id)
    .eq('status', 'pending')
    .single() as { data: { id: string; discord_guild_name: string | null; selected_tone: string; discord_owner_id: string } | null }

  if (!pending) {
    return ApiResponse.badRequest('해당 Discord 서버의 봇 설치 정보를 찾을 수 없습니다')
  }

  // 3. discord_bot_installations 생성 (중복 방지: upsert)
  const { error: installError } = await admin
    .from('discord_bot_installations')
    .upsert(
      {
        club_id: body.club_id,
        discord_guild_id: body.guild_id,
        discord_guild_name: pending.discord_guild_name,
        installed_by: user.id,
      },
      { onConflict: 'club_id,discord_guild_id' }
    )

  if (installError) {
    console.error('[Discord Connect] installation 저장 실패:', installError.message)
    return ApiResponse.internalError('Discord 연결에 실패했습니다')
  }

  // 4. club_ghostwriter_settings 생성 (온보딩에서 선택한 톤 반영)
  const { error: settingsError } = await admin
    .from('club_ghostwriter_settings')
    .upsert(
      {
        club_id: body.club_id,
        ai_tone: pending.selected_tone || 'formal',
      },
      { onConflict: 'club_id' }
    )

  if (settingsError) {
    console.error('[Discord Connect] settings 저장 실패:', settingsError.message)
    // 치명적이지 않으므로 계속 진행
  }

  // 5. pending 상태를 claimed으로 변경
  await admin
    .from('pending_discord_setups' as any)
    .update({ status: 'claimed', claimed_at: new Date().toISOString() })
    .eq('id', pending.id)

  // 6. 서버 표준 템플릿 프로비저닝
  // 이미 존재하는 채널은 건너뛰고, FileTrail 대상 채널을 DB에 자동 등록
  // 실패해도 연결 자체는 성공으로 처리 (프로비저닝은 나중에 재시도 가능)
  let provisionResult = null
  try {
    provisionResult = await provisionClubServer(body.guild_id, body.club_id)
    console.log(
      `[Discord Connect] 프로비저닝 완료: ${provisionResult.created.length}개 생성, ${provisionResult.registered}개 FileTrail 등록`
    )
  } catch (err) {
    console.error('[Discord Connect] 프로비저닝 실패 (연결은 유지):', err)
  }

  return ApiResponse.ok({
    success: true,
    message: 'Discord 서버가 클럽에 연결되었습니다',
    guild_name: pending.discord_guild_name,
    club_id: body.club_id,
    provision: provisionResult
      ? {
          created: provisionResult.created.length,
          skipped: provisionResult.skipped.length,
          fileTrailChannels: provisionResult.registered,
        }
      : null,
  })
}

/**
 * GET /api/discord/connect?discord_user_id=xxx
 *
 * 현재 유저의 pending setups 조회
 */
/**
 * DELETE /api/discord/connect
 *
 * Discord 연결 해제: discord_bot_installations + 관련 매핑 + ghostwriter 설정 삭제
 * body: { club_id: string }
 */
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = await parseJsonBody<{ club_id: string }>(request)
  if (body instanceof Response) return body

  if (!body.club_id?.trim() || !isValidUUID(body.club_id)) {
    return ApiResponse.badRequest('유효하지 않은 club_id입니다')
  }

  const admin = createAdminClient()

  // 유저가 해당 클럽의 owner/admin인지 확인
  const { data: membership } = await admin
    .from('club_members')
    .select('role')
    .eq('club_id', body.club_id)
    .eq('user_id', user.id)
    .single()

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return ApiResponse.forbidden('클럽 관리자만 Discord 연결을 해제할 수 있습니다')
  }

  // 1. 채널 매핑 삭제
  await admin
    .from('discord_team_channels')
    .delete()
    .eq('club_id', body.club_id)

  // 2. Ghostwriter 설정 삭제
  await admin
    .from('club_ghostwriter_settings')
    .delete()
    .eq('club_id', body.club_id)

  // 3. 봇 설치 기록 삭제
  const { error } = await admin
    .from('discord_bot_installations')
    .delete()
    .eq('club_id', body.club_id)

  if (error) {
    console.error('[Discord Disconnect] 삭제 실패:', error.message)
    return ApiResponse.internalError('Discord 연결 해제에 실패했습니다')
  }

  return ApiResponse.ok({
    success: true,
    message: 'Discord 연결이 해제되었습니다',
  })
}

/**
 * GET /api/discord/connect?discord_user_id=xxx
 *
 * 현재 유저의 pending setups 조회
 */
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const admin = createAdminClient()

  // 유저의 discord_user_id 조회
  const { data: profile } = await admin
    .from('profiles')
    .select('discord_user_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.discord_user_id) {
    return ApiResponse.ok({ pending_setups: [], discord_linked: false })
  }

  // pending setups 중 이 Discord 유저가 owner인 것
  const { data: pendingSetups } = await admin
    .from('pending_discord_setups' as any)
    .select('*')
    .eq('discord_owner_id', profile.discord_user_id)
    .eq('status', 'pending') as { data: any[] | null }

  // 유저가 admin/owner인 클럽 목록
  const { data: memberships } = await admin
    .from('club_members')
    .select('club_id, role, clubs(id, name, slug, logo_url)')
    .eq('user_id', user.id)
    .in('role', ['owner', 'admin'])

  return ApiResponse.ok({
    pending_setups: pendingSetups ?? [],
    discord_linked: true,
    clubs: memberships?.map(m => ({
      ...m.clubs,
      role: m.role,
    })) ?? [],
  })
}
