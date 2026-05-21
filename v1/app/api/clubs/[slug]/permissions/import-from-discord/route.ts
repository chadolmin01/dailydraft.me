/**
 * POST /api/clubs/[slug]/permissions/import-from-discord
 *
 * 연결된 Discord 서버에서 채널·역할·멤버를 읽어 권한 시스템 테이블에 import.
 * 기존 club_permission_* 내용을 전부 대체한다 (wipe & reinsert).
 *
 * 전제:
 *   - club은 `discord_bot_installations`에 이미 연결돼 있음
 *   - 봇이 해당 guild에 필요한 권한을 가지고 있음
 *
 * Discord 역할 → Draft 권한 역할 매핑:
 *   - @everyone(managed=true, id==guild.id) 제외
 *   - managed=true 제외 (봇이 관리하는 역할)
 *   - is_admin: Discord permissions에 ADMINISTRATOR(0x8) 비트 포함 시 true
 *
 * Discord 채널 → Draft 권한 채널:
 *   - type=0 (텍스트) + type=15 (포럼) 만 포함
 *   - parent_id가 카테고리면 카테고리 이름을 category로, 없으면 "기타"
 *
 * Discord 멤버 → 권한 멤버:
 *   - profiles.discord_user_id 와 매칭되는 Draft user만 포함
 *   - 한 사람이 여러 Discord role에 속해 있으면, 가장 높은 권한 role에 배정
 *     (priority: is_admin > display_order ASC)
 */

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import {
  fetchGuild,
  fetchGuildChannels,
  fetchGuildRoles,
  type DiscordChannel,
  type DiscordRole,
} from '@/src/lib/discord/client'

const ADMINISTRATOR_BIT = 0x8n
const ROLE_COLORS = ['#8b5cf6','#3b82f6','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6','#6b7280']

type BotInstallationRow = {
  discord_guild_id: string
}
type ClubRow = { id: string; name: string; slug: string }
type DiscordGuildMemberFull = {
  user?: { id: string; username: string; global_name?: string | null }
  nick: string | null
  roles: string[]
}

function discordColorToHex(color: number, fallbackIdx: number): string {
  if (!color || color === 0) return ROLE_COLORS[fallbackIdx % ROLE_COLORS.length]
  return '#' + color.toString(16).padStart(6, '0')
}

function roleIsAdmin(permissions: string): boolean {
  try {
    return (BigInt(permissions) & ADMINISTRATOR_BIT) !== 0n
  } catch {
    return false
  }
}

async function fetchAllGuildMembers(
  guildId: string,
): Promise<DiscordGuildMemberFull[]> {
  const token = process.env.DISCORD_BOT_TOKEN
  if (!token) throw new Error('DISCORD_BOT_TOKEN 환경변수 없음')

  const all: DiscordGuildMemberFull[] = []
  let after = '0'
  for (let page = 0; page < 20; page++) {
    const url = `https://discord.com/api/v10/guilds/${guildId}/members?limit=1000&after=${after}`
    const res = await fetch(url, {
      headers: { Authorization: `Bot ${token}` },
    })
    if (!res.ok) {
      throw new Error(`Discord members API ${res.status}: ${await res.text().catch(() => '')}`)
    }
    const batch = (await res.json()) as DiscordGuildMemberFull[]
    if (batch.length === 0) break
    all.push(...batch)
    if (batch.length < 1000) break
    const last = batch[batch.length - 1].user?.id
    if (!last) break
    after = last
  }
  return all
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const clubRes = await supabase
    .from('clubs')
    .select('id, name, slug')
    .eq('slug', slug)
    .maybeSingle()
  const club = clubRes.data as unknown as ClubRow | null
  if (!club) return ApiResponse.notFound('클럽을 찾을 수 없습니다')

  const { data: membership } = await supabase
    .from('club_members')
    .select('role')
    .eq('club_id', club.id)
    .eq('user_id', user.id)
    .in('role', ['owner', 'admin'])
    .maybeSingle()
  if (!membership) return ApiResponse.forbidden('권한이 없습니다')

  // Discord 연결 확인
  const installationRes = await supabase
    .from('discord_bot_installations')
    .select('discord_guild_id')
    .eq('club_id', club.id)
    .maybeSingle()
  const installation = installationRes.data as unknown as BotInstallationRow | null
  if (!installation) {
    return ApiResponse.badRequest('Discord 서버가 연결되지 않았습니다')
  }
  const guildId = installation.discord_guild_id

  // 병렬 fetch
  let guild: { id: string; name: string; icon: string | null }
  let channels: DiscordChannel[]
  let roles: DiscordRole[]
  let members: DiscordGuildMemberFull[]
  try {
    ;[guild, channels, roles, members] = await Promise.all([
      fetchGuild(guildId),
      fetchGuildChannels(guildId),
      fetchGuildRoles(guildId),
      fetchAllGuildMembers(guildId),
    ])
  } catch (e) {
    return ApiResponse.internalError(
      e instanceof Error ? `Discord fetch 실패: ${e.message}` : 'Discord fetch 실패'
    )
  }

  // ── Discord → Draft 변환 ─────────────────────────────────────

  // 1) 카테고리(type=4) 먼저 인덱싱
  const categoryIdToName = new Map<string, string>()
  for (const ch of channels) {
    if (ch.type === 4) categoryIdToName.set(ch.id, ch.name)
  }

  // 2) 텍스트/포럼 채널만 추출
  const textChannels = channels
    .filter((c) => c.type === 0 || c.type === 15)
    .map((c, i) => ({
      name: c.name,
      category: (c.parent_id && categoryIdToName.get(c.parent_id)) || '기타',
      display_order: i,
      discord_channel_id: c.id,
      discord_category_id: c.parent_id ?? null,
    }))

  // 3) 역할 필터 & 정렬 (position 내림차순 = 상위 우선)
  const usableRoles = roles
    .filter((r) => !r.managed && r.id !== guildId) // @everyone 제외
    .sort((a, b) => b.position - a.position)
    .map((r, i) => ({
      name: r.name,
      description: '',
      is_admin: roleIsAdmin(r.permissions),
      dot_color: discordColorToHex(r.color, i),
      display_order: i,
      discord_role_id: r.id,
    }))

  if (usableRoles.length === 0) {
    return ApiResponse.badRequest('가져올 수 있는 역할이 없습니다 (@everyone 외 역할을 먼저 생성해주세요)')
  }

  // 4) 멤버 — Draft 프로필과 매칭
  const discordUserIds = members
    .map((m) => m.user?.id)
    .filter((x): x is string => Boolean(x))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  const profilesRes = discordUserIds.length
    ? await admin
        .from('profiles')
        .select('user_id, discord_user_id')
        .in('discord_user_id', discordUserIds)
    : { data: [] as { user_id: string; discord_user_id: string }[] }

  const profiles = (profilesRes.data ?? []) as { user_id: string; discord_user_id: string }[]
  const discordIdToDraftId = new Map<string, string>()
  profiles.forEach((p) => discordIdToDraftId.set(p.discord_user_id, p.user_id))

  // Discord role id → Draft role index
  const discordRoleIdToIndex = new Map<string, number>()
  usableRoles.forEach((r, i) => discordRoleIdToIndex.set(r.discord_role_id, i))

  // 한 멤버 = 한 역할 (가장 높은 position)
  const memberAssignments = new Map<number, string[]>() // roleIndex → userIds
  for (const m of members) {
    const dUserId = m.user?.id
    if (!dUserId) continue
    const draftUserId = discordIdToDraftId.get(dUserId)
    if (!draftUserId) continue // Draft 가입 안 한 멤버는 스킵

    // 이 멤버가 가진 role 중 가장 높은 position (usableRoles 중에서)
    let best: number | null = null
    for (const rid of m.roles) {
      const idx = discordRoleIdToIndex.get(rid)
      if (idx === undefined) continue
      if (best === null || idx < best) best = idx // 낮은 index = 높은 position
    }
    if (best === null) continue

    const arr = memberAssignments.get(best) ?? []
    arr.push(draftUserId)
    memberAssignments.set(best, arr)
  }

  // ── DB write: wipe & reinsert (기존 permissions API의 PUT과 동일 패턴) ──

  await admin.from('club_permission_roles').delete().eq('club_id', club.id)
  await admin.from('club_permission_channels').delete().eq('club_id', club.id)

  // Channels
  const channelRows = textChannels.map((c) => ({
    club_id: club.id,
    name: c.name,
    category: c.category,
    display_order: c.display_order,
    discord_channel_id: c.discord_channel_id,
    discord_category_id: c.discord_category_id,
  }))
  const channelNameToId = new Map<string, string>()
  if (channelRows.length > 0) {
    const { data: inserted, error } = await admin
      .from('club_permission_channels')
      .insert(channelRows)
      .select('id, name')
    if (error) return ApiResponse.internalError('채널 저장 실패')
    ;(inserted as { id: string; name: string }[]).forEach((c) => channelNameToId.set(c.name, c.id))
  }

  // Roles
  const roleRows = usableRoles.map((r) => ({
    club_id: club.id,
    name: r.name,
    description: r.description,
    is_admin: r.is_admin,
    dot_color: r.dot_color,
    display_order: r.display_order,
    discord_role_id: r.discord_role_id,
  }))
  const roleIndexToId = new Map<number, string>()
  if (roleRows.length > 0) {
    const { data: inserted, error } = await admin
      .from('club_permission_roles')
      .insert(roleRows)
      .select('id, display_order')
    if (error) return ApiResponse.internalError('역할 저장 실패')
    ;(inserted as { id: string; display_order: number }[]).forEach((r) => roleIndexToId.set(r.display_order, r.id))
  }

  // Role ↔ Channel: Discord는 채널별 overwrite 구조라 복잡하므로
  // Phase 2 단순 전략: "admin 역할은 모든 채널 접근, 나머지는 모든 텍스트 채널 접근"
  // Phase 3에서 실제 overwrite 파싱해서 정확히 매핑할 수 있음
  const rcRows: { role_id: string; channel_id: string }[] = []
  for (const role of usableRoles) {
    const roleId = roleIndexToId.get(role.display_order)
    if (!roleId) continue
    for (const chName of channelNameToId.keys()) {
      const cid = channelNameToId.get(chName)
      if (!cid) continue
      rcRows.push({ role_id: roleId, channel_id: cid })
    }
  }
  if (rcRows.length > 0) {
    const { error } = await admin.from('club_permission_role_channels').insert(rcRows)
    if (error) return ApiResponse.internalError('채널 접근 저장 실패')
  }

  // Role ↔ Member
  const rmRows: { role_id: string; user_id: string }[] = []
  for (const [roleIdx, userIds] of memberAssignments.entries()) {
    const roleId = roleIndexToId.get(roleIdx)
    if (!roleId) continue
    for (const uid of userIds) {
      rmRows.push({ role_id: roleId, user_id: uid })
    }
  }
  if (rmRows.length > 0) {
    const { error } = await admin.from('club_permission_role_members').insert(rmRows)
    if (error) return ApiResponse.internalError('멤버 배정 저장 실패')
  }

  // clubs 테이블 preset 표시
  await admin
    .from('clubs')
    .update({
      permission_preset: 'imported',
      permission_member_source: 'discord-sync',
    })
    .eq('id', club.id)

  return ApiResponse.ok({
    ok: true,
    imported: {
      guild_name: guild.name,
      roles: usableRoles.length,
      channels: textChannels.length,
      categories: categoryIdToName.size,
      matched_members: rmRows.length,
      total_discord_members: members.length,
    },
  })
}
