import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse, isValidUUID, parseJsonBody } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { fetchGuildChannels, fetchChannelMessages } from '@/src/lib/discord/client'

type RouteParams = { params: Promise<{ slug: string }> }

/** GET: 매핑된 Discord 채널 목록 + Discord 서버의 전체 채널 목록 */
export const GET = withErrorCapture(async (_request, { params }: RouteParams) => {
  const { slug: clubId } = await params
  if (!isValidUUID(clubId)) return ApiResponse.badRequest('유효하지 않은 클럽 ID입니다')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const admin = createAdminClient()

  // 이미 매핑된 채널
  const { data: mappings } = await admin
    .from('discord_team_channels')
    .select('id, opportunity_id, discord_channel_id, discord_channel_name, created_at')
    .eq('club_id', clubId)

  // 봇이 설치된 Discord 서버 조회
  const { data: inst } = await admin
    .from('discord_bot_installations')
    .select('discord_guild_id, discord_guild_name')
    .eq('club_id', clubId)
    .single()

  // Discord 서버의 텍스트 채널 목록 (봇이 설치된 경우)
  let availableChannels: { id: string; name: string }[] = []
  if (inst) {
    try {
      const channels = await fetchGuildChannels(inst.discord_guild_id)
      availableChannels = channels
        .filter((c) => c.type === 0)
        .map((c) => ({ id: c.id, name: c.name }))
    } catch {
      // 봇 권한 문제 등 — 빈 배열로 진행
    }
  }

  // 클럽의 프로젝트 목록 (매핑 UI에서 드롭다운용)
  const { data: opportunities } = await admin
    .from('opportunities')
    .select('id, title')
    .eq('club_id', clubId)
    .order('created_at', { ascending: false })

  return ApiResponse.ok({
    mappings: mappings ?? [],
    available_channels: availableChannels,
    opportunities: opportunities ?? [],
    guild: inst ? { id: inst.discord_guild_id, name: inst.discord_guild_name } : null,
  })
})

/** POST: Discord 채널 ↔ Draft 프로젝트 매핑 생성 */
export const POST = withErrorCapture(async (request, { params }: RouteParams) => {
  const { slug: clubId } = await params
  if (!isValidUUID(clubId)) return ApiResponse.badRequest('유효하지 않은 클럽 ID입니다')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = await parseJsonBody<{
    opportunity_id: string
    discord_channel_id: string
    discord_channel_name?: string
  }>(request)
  if (body instanceof Response) return body

  if (!body.opportunity_id || !isValidUUID(body.opportunity_id)) {
    return ApiResponse.badRequest('유효하지 않은 프로젝트 ID입니다')
  }
  if (!body.discord_channel_id?.trim()) {
    return ApiResponse.badRequest('Discord 채널 ID는 필수입니다')
  }

  // 봇이 해당 채널에서 메시지를 읽을 수 있는지 검증
  // 권한 없으면 매핑해도 Ghostwriter가 동작하지 않으므로 사전 차단
  try {
    await fetchChannelMessages(body.discord_channel_id.trim(), { maxMessages: 1 })
  } catch {
    return ApiResponse.badRequest('봇이 이 채널에 접근할 수 없습니다. 채널 권한을 확인해주세요.')
  }

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('discord_team_channels')
    .insert({
      club_id: clubId,
      opportunity_id: body.opportunity_id,
      discord_channel_id: body.discord_channel_id.trim(),
      discord_channel_name: body.discord_channel_name?.trim() || null,
      created_by: user.id,
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      return ApiResponse.badRequest('이미 매핑된 채널 또는 프로젝트입니다')
    }
    return ApiResponse.internalError('매핑 생성에 실패했습니다')
  }

  return ApiResponse.created(data)
})

/** DELETE: Discord 채널 ↔ Draft 프로젝트 매핑 삭제 */
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

  const { error } = await admin
    .from('discord_team_channels')
    .delete()
    .eq('id', mappingId)
    .eq('club_id', clubId)

  if (error) {
    return ApiResponse.internalError('매핑 삭제에 실패했습니다')
  }

  return ApiResponse.ok({ deleted: true })
})
