/**
 * Discord 팀 채널 자동 프로비저닝
 *
 * Draft에서 팀(프로젝트) 생성 시 Discord 서버에:
 * 1. 팀 전용 카테고리 생성
 * 2. 팀 전용 Role 생성
 * 3. @everyone 접근 차단 + Team Role만 접근 허용 (정보 격리)
 * 4. 기본 채널(일반, 자료공유) 생성
 * 5. DB에 매핑 저장
 *
 * 왜 이 순서인가:
 * - 카테고리를 먼저 만들어야 채널의 parent_id를 지정할 수 있음
 * - Role을 먼저 만들어야 카테고리/채널에 권한 오버라이드를 걸 수 있음
 * - 따라서: Role → 카테고리(권한 포함) → 채널 순서
 *
 * 실패 시 부분 생성된 리소스를 정리(cleanup)하여 고아 채널/역할 방지
 */

import {
  createGuildRole,
  createGuildChannel,
  editChannelPermissions,
  deleteChannel,
  deleteGuildRole,
  addGuildMemberRole,
  type DiscordPermissionOverwrite,
} from './client'
import { createAdminClient } from '@/src/lib/supabase/admin'

// Discord 권한 비트
const PERMS = {
  VIEW_CHANNEL: '1024',
  SEND_MESSAGES: '2048',
  READ_MESSAGE_HISTORY: '65536',
  ADD_REACTIONS: '64',
  ATTACH_FILES: '32768',
  USE_EXTERNAL_EMOJIS: '262144',
  // 합산: 팀원 기본 권한
  TEAM_MEMBER_ALLOW: String(1024 + 2048 + 65536 + 64 + 32768 + 262144),
  // @everyone 거부: VIEW_CHANNEL
  EVERYONE_DENY: '1024',
}

export interface ProvisionResult {
  categoryId: string
  roleId: string
  channels: { id: string; name: string }[]
}

/**
 * 팀 Discord 채널 프로비저닝 실행
 *
 * @param guildId - Discord 서버 ID
 * @param teamName - 팀/프로젝트 이름
 * @param opportunityId - Draft 프로젝트 ID
 * @param clubId - Draft 클럽 ID
 * @param createdBy - 요청한 유저 ID (audit용)
 * @param teamMemberDiscordIds - 이미 알려진 팀원들의 Discord ID (선택)
 */
export async function provisionTeamChannels(
  guildId: string,
  teamName: string,
  opportunityId: string,
  clubId: string,
  createdBy: string,
  teamMemberDiscordIds?: string[]
): Promise<ProvisionResult> {
  const admin = createAdminClient()
  const cleanupRoleId: string | null = null
  const cleanupChannelIds: string[] = []

  // 랜덤 색상 (파스텔 계열 — 팀 구분용)
  const teamColor = Math.floor(Math.random() * 0xFFFFFF)

  let roleId: string
  let categoryId: string

  try {
    // 1. 팀 전용 Role 생성
    const role = await createGuildRole(guildId, teamName, { color: teamColor })
    roleId = role.id

    // 2. 카테고리 생성 + @everyone 숨김 + Team Role 접근 허용
    const everyoneRoleId = guildId // @everyone role ID = guild ID (Discord 규칙)
    const categoryOverwrites: DiscordPermissionOverwrite[] = [
      { id: everyoneRoleId, type: 0, allow: '0', deny: PERMS.EVERYONE_DENY },
      { id: roleId, type: 0, allow: PERMS.TEAM_MEMBER_ALLOW, deny: '0' },
    ]

    const category = await createGuildChannel(guildId, `🏷️ ${teamName}`, {
      type: 4,
      permission_overwrites: categoryOverwrites,
    })
    categoryId = category.id
    cleanupChannelIds.push(categoryId)

    // 3. 기본 채널 생성 (카테고리 안에 — 권한 자동 상속)
    const channels: { id: string; name: string }[] = []

    const generalChannel = await createGuildChannel(guildId, '일반', {
      type: 0,
      parent_id: categoryId,
      topic: `${teamName} 팀 일반 채널`,
    })
    channels.push({ id: generalChannel.id, name: '일반' })
    cleanupChannelIds.push(generalChannel.id)

    // Rate limit 방지 딜레이
    await sleep(500)

    const resourceChannel = await createGuildChannel(guildId, '자료공유', {
      type: 0,
      parent_id: categoryId,
      topic: `${teamName} 팀 자료 공유`,
    })
    channels.push({ id: resourceChannel.id, name: '자료공유' })
    cleanupChannelIds.push(resourceChannel.id)

    // 4. DB에 매핑 저장 (일반 채널을 주 채널로 매핑)
    // 마이그레이션으로 추가한 컬럼이 Supabase 타입에 아직 반영 안 되었으므로 any 캐스트
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (admin as any)
      .from('discord_team_channels')
      .insert({
        club_id: clubId,
        opportunity_id: opportunityId,
        discord_channel_id: generalChannel.id,
        discord_channel_name: '일반',
        discord_category_id: categoryId,
        discord_role_id: roleId,
        created_by: createdBy,
      })

    if (insertError) {
      console.error('[provision] DB insert failed:', insertError.message)
      throw new Error(`DB 매핑 저장 실패: ${insertError.message}`)
    }

    // 5. 기존 팀원에게 Role 부여 (선택)
    if (teamMemberDiscordIds && teamMemberDiscordIds.length > 0) {
      for (const discordId of teamMemberDiscordIds) {
        try {
          await addGuildMemberRole(guildId, discordId, roleId)
          await sleep(300)
        } catch (e) {
          // Role 부여 실패는 치명적이지 않으므로 경고만
          console.warn(`[provision] Role 부여 실패 (${discordId}):`, e)
        }
      }
    }

    return { categoryId, roleId, channels }
  } catch (error) {
    // 실패 시 cleanup: 생성된 채널/카테고리/역할 삭제
    console.error('[provision] 프로비저닝 실패, cleanup 시작:', error)

    for (const channelId of cleanupChannelIds.reverse()) {
      try { await deleteChannel(channelId) } catch { /* 무시 */ }
      await sleep(300)
    }

    if (cleanupRoleId) {
      try { await deleteGuildRole(guildId, cleanupRoleId) } catch { /* 무시 */ }
    }

    throw error
  }
}

/**
 * 프로비저닝된 팀 채널 삭제
 * 팀 해체 또는 프로젝트 삭제 시 호출
 */
export async function deprovisionTeamChannels(
  guildId: string,
  opportunityId: string
): Promise<void> {
  const admin = createAdminClient()

  // DB에서 매핑 조회
  // 마이그레이션으로 추가한 컬럼이 Supabase 타입에 아직 반영 안 되었으므로 any 캐스트
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: mapping } = await (admin as any)
    .from('discord_team_channels')
    .select('discord_channel_id, discord_category_id, discord_role_id')
    .eq('opportunity_id', opportunityId)
    .maybeSingle()

  if (!mapping) return

  // Discord에서 삭제 (채널 → 카테고리 → 역할 순서)
  if (mapping.discord_channel_id) {
    try { await deleteChannel(mapping.discord_channel_id) } catch { /* */ }
  }
  if (mapping.discord_category_id) {
    try { await deleteChannel(mapping.discord_category_id) } catch { /* */ }
  }
  if (mapping.discord_role_id) {
    try { await deleteGuildRole(guildId, mapping.discord_role_id) } catch { /* */ }
  }

  // DB에서 매핑 삭제
  await admin
    .from('discord_team_channels')
    .delete()
    .eq('opportunity_id', opportunityId)
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}
