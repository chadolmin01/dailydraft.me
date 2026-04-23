import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'

// ============================================
// 로컬 Row 타입 (Supabase types.ts 재생성 전 임시 정의)
// ============================================
type ClubRow = {
  id: string
  name: string
  slug: string
  permission_preset: string | null
  permission_member_source: 'discord-sync' | 'draft-match' | 'manual' | null
}
type BotInstallationRow = {
  discord_guild_id: string
  discord_guild_name: string | null
  installed_at: string
}
type PermissionRoleRow = {
  id: string
  name: string
  description: string
  is_admin: boolean
  dot_color: string
  display_order: number
}
type PermissionChannelRow = {
  id: string
  name: string
  category: string
  display_order: number
}
type RoleChannelRow = { role_id: string; channel_id: string }
type RoleMemberRow = { role_id: string; user_id: string | null }
type ClubMemberRow = { user_id: string | null; role: string; display_role: string | null; status: string }
type ProfileRow = { id: string; display_name: string | null; avatar_url: string | null }

// ============================================
// Wire format
// ============================================
export type PermissionsConfigResponse = {
  club: {
    id: string
    name: string
    slug: string
    permission_preset: string | null
    permission_member_source: 'discord-sync' | 'draft-match' | 'manual' | null
  }
  discord: {
    connected: boolean
    guild_id: string | null
    guild_name: string | null
    connected_at: string | null
  }
  roles: {
    id: string
    name: string
    description: string
    is_admin: boolean
    dot_color: string
    display_order: number
    channel_names: string[]
    member_user_ids: string[]
  }[]
  channels: PermissionChannelRow[]
  available_members: {
    user_id: string
    display_name: string
    avatar_url: string | null
    club_member_role: string
  }[]
}

const PutBodySchema = z.object({
  permission_preset: z.string().nullable(),
  permission_member_source: z.enum(['discord-sync', 'draft-match', 'manual']).nullable(),
  roles: z.array(z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).default(''),
    is_admin: z.boolean(),
    dot_color: z.string().max(20),
    display_order: z.number().int().min(0),
    channel_names: z.array(z.string().min(1).max(100)),
    member_user_ids: z.array(z.string().uuid()),
  })).max(50),
  channels: z.array(z.object({
    name: z.string().min(1).max(100),
    category: z.string().min(1).max(100),
    display_order: z.number().int().min(0),
  })).max(100),
})

async function loadClubIfAdmin(slug: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' as const }

  const clubRes = await supabase
    .from('clubs')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .select('id, name, slug, permission_preset, permission_member_source' as any)
    .eq('slug', slug)
    .maybeSingle()
  const club = clubRes.data as unknown as ClubRow | null
  if (!club) return { error: 'not_found' as const }

  const { data: membership } = await supabase
    .from('club_members')
    .select('role')
    .eq('club_id', club.id)
    .eq('user_id', user.id)
    .in('role', ['owner', 'admin'])
    .maybeSingle()
  if (!membership) return { error: 'forbidden' as const }

  return { club, user, supabase }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const res = await loadClubIfAdmin(slug)
  if ('error' in res) {
    if (res.error === 'unauthorized') return ApiResponse.unauthorized()
    if (res.error === 'not_found') return ApiResponse.notFound('클럽을 찾을 수 없습니다')
    return ApiResponse.forbidden('클럽 설정을 볼 권한이 없습니다')
  }
  const { club, supabase } = res

  // Discord 연결 상태는 discord_bot_installations 에서 (이 앱의 SoT)
  const installationRes = await supabase
    .from('discord_bot_installations')
    .select('discord_guild_id, discord_guild_name, installed_at')
    .eq('club_id', club.id)
    .maybeSingle()
  const installation = installationRes.data as unknown as BotInstallationRow | null

  const [rolesRes, channelsRes, rcRes, rmRes, cmRes] = await Promise.all([
    supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('club_permission_roles' as any)
      .select('id, name, description, is_admin, dot_color, display_order')
      .eq('club_id', club.id)
      .order('display_order', { ascending: true }),
    supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('club_permission_channels' as any)
      .select('id, name, category, display_order')
      .eq('club_id', club.id)
      .order('display_order', { ascending: true }),
    supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('club_permission_role_channels' as any)
      .select('role_id, channel_id'),
    supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('club_permission_role_members' as any)
      .select('role_id, user_id')
      .not('user_id', 'is', null),
    supabase
      .from('club_members')
      .select('user_id, role, display_role, status')
      .eq('club_id', club.id)
      .eq('status', 'active')
      .not('user_id', 'is', null),
  ])

  if (rolesRes.error) return ApiResponse.internalError('역할을 불러오지 못했습니다')
  if (channelsRes.error) return ApiResponse.internalError('채널을 불러오지 못했습니다')

  const roles = (rolesRes.data ?? []) as unknown as PermissionRoleRow[]
  const channels = (channelsRes.data ?? []) as unknown as PermissionChannelRow[]
  const roleChannels = (rcRes.data ?? []) as unknown as RoleChannelRow[]
  const roleMembers = (rmRes.data ?? []) as unknown as RoleMemberRow[]
  const clubMembers = (cmRes.data ?? []) as unknown as ClubMemberRow[]

  const channelIdToName = new Map<string, string>()
  channels.forEach((c) => channelIdToName.set(c.id, c.name))

  const byRoleChannels = new Map<string, string[]>()
  for (const rc of roleChannels) {
    const chName = channelIdToName.get(rc.channel_id)
    if (!chName) continue
    const arr = byRoleChannels.get(rc.role_id) ?? []
    arr.push(chName)
    byRoleChannels.set(rc.role_id, arr)
  }

  const byRoleMembers = new Map<string, string[]>()
  for (const rm of roleMembers) {
    if (!rm.user_id) continue
    const arr = byRoleMembers.get(rm.role_id) ?? []
    arr.push(rm.user_id)
    byRoleMembers.set(rm.role_id, arr)
  }

  const memberUserIds = clubMembers.map((m) => m.user_id).filter(Boolean) as string[]
  const profilesById = new Map<string, ProfileRow>()
  if (memberUserIds.length > 0) {
    const profilesRes = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('profiles' as any)
      .select('id, display_name, avatar_url')
      .in('id', memberUserIds)
    const profiles = (profilesRes.data ?? []) as unknown as ProfileRow[]
    profiles.forEach((p) => { profilesById.set(p.id, p) })
  }

  const available_members = clubMembers
    .filter((m) => m.user_id)
    .map((m) => {
      const p = profilesById.get(m.user_id as string)
      return {
        user_id: m.user_id as string,
        display_name: p?.display_name || m.display_role || '이름 없음',
        avatar_url: p?.avatar_url ?? null,
        club_member_role: m.role,
      }
    })

  const payload: PermissionsConfigResponse = {
    club: {
      id: club.id,
      name: club.name,
      slug: club.slug,
      permission_preset: club.permission_preset,
      permission_member_source: club.permission_member_source,
    },
    discord: {
      connected: Boolean(installation?.discord_guild_id),
      guild_id: installation?.discord_guild_id ?? null,
      guild_name: installation?.discord_guild_name ?? null,
      connected_at: installation?.installed_at ?? null,
    },
    roles: roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description ?? '',
      is_admin: r.is_admin,
      dot_color: r.dot_color,
      display_order: r.display_order,
      channel_names: byRoleChannels.get(r.id) ?? [],
      member_user_ids: byRoleMembers.get(r.id) ?? [],
    })),
    channels,
    available_members,
  }
  return ApiResponse.ok(payload)
}

// PUT 은 Phase 1과 동일 — 권한 시스템 4개 테이블에 write만 함
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const res = await loadClubIfAdmin(slug)
  if ('error' in res) {
    if (res.error === 'unauthorized') return ApiResponse.unauthorized()
    if (res.error === 'not_found') return ApiResponse.notFound('클럽을 찾을 수 없습니다')
    return ApiResponse.forbidden('클럽 설정을 저장할 권한이 없습니다')
  }
  const { club } = res

  let body: z.infer<typeof PutBodySchema>
  try {
    const json = await request.json()
    body = PutBodySchema.parse(json)
  } catch {
    return ApiResponse.badRequest('요청 형식이 올바르지 않습니다')
  }

  const channelNameSet = new Set(body.channels.map((c) => c.name))
  for (const r of body.roles) {
    for (const cn of r.channel_names) {
      if (!channelNameSet.has(cn)) {
        return ApiResponse.badRequest(`역할 "${r.name}"이 존재하지 않는 채널 "${cn}"을 참조합니다`)
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  {
    const { error } = await admin
      .from('clubs')
      .update({
        permission_preset: body.permission_preset,
        permission_member_source: body.permission_member_source,
      })
      .eq('id', club.id)
    if (error) return ApiResponse.internalError('클럽 설정 저장 실패')
  }

  {
    const { error } = await admin.from('club_permission_roles').delete().eq('club_id', club.id)
    if (error) return ApiResponse.internalError('기존 역할 삭제 실패')
  }
  {
    const { error } = await admin.from('club_permission_channels').delete().eq('club_id', club.id)
    if (error) return ApiResponse.internalError('기존 채널 삭제 실패')
  }

  const channelRows = body.channels.map((c) => ({
    club_id: club.id,
    name: c.name,
    category: c.category,
    display_order: c.display_order,
  }))
  const channelNameToId = new Map<string, string>()
  if (channelRows.length > 0) {
    const { data: inserted, error } = await admin
      .from('club_permission_channels')
      .insert(channelRows)
      .select('id, name')
    if (error) return ApiResponse.internalError('채널 저장 실패')
    const rows = (inserted ?? []) as { id: string; name: string }[]
    rows.forEach((c) => channelNameToId.set(c.name, c.id))
  }

  const roleRows = body.roles.map((r) => ({
    club_id: club.id,
    name: r.name,
    description: r.description,
    is_admin: r.is_admin,
    dot_color: r.dot_color,
    display_order: r.display_order,
  }))
  const roleNameToId = new Map<string, string>()
  if (roleRows.length > 0) {
    const { data: inserted, error } = await admin
      .from('club_permission_roles')
      .insert(roleRows)
      .select('id, name')
    if (error) return ApiResponse.internalError('역할 저장 실패')
    const rows = (inserted ?? []) as { id: string; name: string }[]
    rows.forEach((r) => roleNameToId.set(r.name, r.id))
  }

  const rcRows: { role_id: string; channel_id: string }[] = []
  for (const r of body.roles) {
    const rid = roleNameToId.get(r.name)
    if (!rid) continue
    for (const cn of r.channel_names) {
      const cid = channelNameToId.get(cn)
      if (!cid) continue
      rcRows.push({ role_id: rid, channel_id: cid })
    }
  }
  if (rcRows.length > 0) {
    const { error } = await admin.from('club_permission_role_channels').insert(rcRows)
    if (error) return ApiResponse.internalError('채널 접근 저장 실패')
  }

  const validMembersRes = await admin
    .from('club_members')
    .select('user_id')
    .eq('club_id', club.id)
    .eq('status', 'active')
    .not('user_id', 'is', null)
  const validMembers = (validMembersRes.data ?? []) as { user_id: string }[]
  const validUserIds = new Set(validMembers.map((m) => m.user_id))

  const rmRows: { role_id: string; user_id: string }[] = []
  for (const r of body.roles) {
    const rid = roleNameToId.get(r.name)
    if (!rid) continue
    for (const uid of r.member_user_ids) {
      if (!validUserIds.has(uid)) continue
      rmRows.push({ role_id: rid, user_id: uid })
    }
  }
  if (rmRows.length > 0) {
    const { error } = await admin.from('club_permission_role_members').insert(rmRows)
    if (error) return ApiResponse.internalError('멤버 배정 저장 실패')
  }

  return ApiResponse.ok({ ok: true })
}
