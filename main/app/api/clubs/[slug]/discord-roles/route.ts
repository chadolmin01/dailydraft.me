/**
 * Discord 역할 매핑 CRUD
 *
 * GET: 현재 매핑 + Discord 서버의 역할 목록
 * POST: 매핑 추가/업데이트
 * DELETE: 매핑 삭제
 */

import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse, isValidUUID, parseJsonBody } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { fetchGuildRoles } from '@/src/lib/discord/client'

type RouteParams = { params: Promise<{ slug: string }> }

/** GET: 현재 매핑 + Discord 서버 역할 목록 */
export const GET = withErrorCapture(async (_request, { params }: RouteParams) => {
  const { slug: clubId } = await params
  if (!isValidUUID(clubId)) return ApiResponse.badRequest('유효하지 않은 클럽 ID입니다')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const admin = createAdminClient()

  // 봇 설치 정보
  const { data: inst } = await admin
    .from('discord_bot_installations')
    .select('discord_guild_id, discord_guild_name')
    .eq('club_id', clubId)
    .single()

  if (!inst) {
    return ApiResponse.ok({ mappings: [], discord_roles: [], guild: null })
  }

  // 현재 매핑
  const { data: mappings } = await admin
    .from('discord_role_mappings')
    .select('id, mapping_type, draft_value, discord_role_id, discord_role_name')
    .eq('club_id', clubId)

  // Discord 서버의 역할 목록
  let discordRoles: { id: string; name: string; color: number; managed: boolean }[] = []
  try {
    const roles = await fetchGuildRoles(inst.discord_guild_id)
    // @everyone 역할과 봇 관리 역할 제외
    discordRoles = roles
      .filter(r => r.name !== '@everyone' && !r.managed)
      .map(r => ({ id: r.id, name: r.name, color: r.color, managed: r.managed }))
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch {
    // 봇 권한 문제 — 빈 배열
  }

  return ApiResponse.ok({
    mappings: mappings ?? [],
    discord_roles: discordRoles,
    guild: { id: inst.discord_guild_id, name: inst.discord_guild_name },
  })
})

/** POST: 매핑 추가/업데이트 (upsert) */
export const POST = withErrorCapture(async (request, { params }: RouteParams) => {
  const { slug: clubId } = await params
  if (!isValidUUID(clubId)) return ApiResponse.badRequest('유효하지 않은 클럽 ID입니다')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = await parseJsonBody<{
    mapping_type: string
    draft_value: string
    discord_role_id: string
    discord_role_name?: string
  }>(request)
  if (body instanceof Response) return body

  const validTypes = ['position', 'cohort', 'club_role']
  if (!validTypes.includes(body.mapping_type)) {
    return ApiResponse.badRequest('mapping_type은 position, cohort, club_role 중 하나여야 합니다')
  }
  if (!body.draft_value?.trim()) return ApiResponse.badRequest('draft_value는 필수입니다')
  if (!body.discord_role_id?.trim()) return ApiResponse.badRequest('discord_role_id는 필수입니다')

  const admin = createAdminClient()

  // 관리자 확인
  const { data: membership } = await admin
    .from('club_members')
    .select('role')
    .eq('club_id', clubId)
    .eq('user_id', user.id)
    .single()

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return ApiResponse.forbidden('클럽 관리자만 역할 매핑을 설정할 수 있습니다')
  }

  // guild_id 조회
  const { data: inst } = await admin
    .from('discord_bot_installations')
    .select('discord_guild_id')
    .eq('club_id', clubId)
    .single()

  if (!inst) return ApiResponse.badRequest('Discord가 연결되어 있지 않습니다')

  const { data, error } = await admin
    .from('discord_role_mappings')
    .upsert(
      {
        club_id: clubId,
        discord_guild_id: inst.discord_guild_id,
        mapping_type: body.mapping_type,
        draft_value: body.draft_value.trim(),
        discord_role_id: body.discord_role_id.trim(),
        discord_role_name: body.discord_role_name?.trim() || null,
      },
      { onConflict: 'club_id,mapping_type,draft_value' }
    )
    .select('*')
    .single()

  if (error) {
    console.error('[discord-roles] upsert 실패:', error.message)
    return ApiResponse.internalError('매핑 저장에 실패했습니다')
  }

  return ApiResponse.ok(data)
})

/** DELETE: 매핑 삭제 */
export const DELETE = withErrorCapture(async (request, { params }: RouteParams) => {
  const { slug: clubId } = await params
  if (!isValidUUID(clubId)) return ApiResponse.badRequest('유효하지 않은 클럽 ID입니다')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const { searchParams } = new URL(request.url)
  const mappingId = searchParams.get('id')
  if (!mappingId || !isValidUUID(mappingId)) {
    return ApiResponse.badRequest('유효하지 않은 매핑 ID입니다')
  }

  const admin = createAdminClient()

  // 관리자 확인
  const { data: membership } = await admin
    .from('club_members')
    .select('role')
    .eq('club_id', clubId)
    .eq('user_id', user.id)
    .single()

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return ApiResponse.forbidden()
  }

  const { error } = await admin
    .from('discord_role_mappings')
    .delete()
    .eq('id', mappingId)
    .eq('club_id', clubId)

  if (error) {
    return ApiResponse.internalError('매핑 삭제에 실패했습니다')
  }

  return ApiResponse.ok({ deleted: true })
})
