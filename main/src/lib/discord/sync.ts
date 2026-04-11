/**
 * Discord 싱크 서비스 — Draft 프로필 → Discord 역할/닉네임 동기화
 *
 * Draft가 source of truth. Discord는 표시 레이어.
 * discord_user_id가 없으면 아무 것도 하지 않음 (Discord 미연결 유저도 정상 동작).
 *
 * 동작:
 * 1. 닉네임 설정: "이름 | 직군" 포맷
 * 2. 역할 부여: 직군(@개발자), 기수(@1기), 클럽역할(@운영진)
 * 3. 역할 정리: discord_role_mappings에 등록된 역할만 관리 (수동 역할은 건드리지 않음)
 */

import { createAdminClient } from '@/src/lib/supabase/admin'
import {
  fetchGuildMember,
  setGuildMemberNickname,
  addGuildMemberRole,
  removeGuildMemberRole,
} from './client'
import { POSITION_MAP, PROJECT_ROLE_MAP } from '@/src/constants/roles'

// ── 타입 ──

interface SyncResult {
  success: boolean
  skipped?: string          // 스킵 사유 (Discord 미연결 등)
  nicknameSet?: string
  rolesAdded?: string[]
  rolesRemoved?: string[]
  error?: string
}

interface RoleMapping {
  mapping_type: string
  draft_value: string
  discord_role_id: string
  discord_role_name: string | null
}

// ── 헬퍼 ──

/** 포지션 slug → 한글 직군 라벨 (닉네임 표시용) */
const ROLE_GROUP_LABELS: Record<string, string> = {
  developer: '개발',
  designer: '디자인',
  pm: '기획',
  marketer: '마케팅',
  data: '데이터',
}

function positionToNicknameLabel(positionSlug: string | null): string | null {
  if (!positionSlug) return null
  const position = POSITION_MAP.get(positionSlug)
  if (!position) return null
  return ROLE_GROUP_LABELS[position.roleGroup] ?? null
}

/** 포지션 slug → roleGroup slug (매핑 테이블 lookup용) */
function positionToRoleGroup(positionSlug: string | null): string | null {
  if (!positionSlug) return null
  return POSITION_MAP.get(positionSlug)?.roleGroup ?? null
}

// ── 메인 함수 ──

/**
 * 특정 유저의 Draft 프로필을 Discord에 동기화한다.
 *
 * 호출 시점:
 * - 온보딩 완료 후
 * - 클럽 멤버 역할 변경 시
 * - ghost 클레임 후
 * - 관리자가 수동 싱크 트리거 시
 */
export async function syncMemberToDiscord(
  clubId: string,
  userId: string
): Promise<SyncResult> {
  const supabase = createAdminClient()

  // 1. Draft 데이터 수집 (병렬)
  const [profileRes, memberRes, installRes, mappingsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('nickname, desired_position, discord_user_id')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('club_members')
      .select('role, cohort')
      .eq('club_id', clubId)
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('discord_bot_installations')
      .select('discord_guild_id')
      .eq('club_id', clubId)
      .maybeSingle(),
    supabase
      .from('discord_role_mappings')
      .select('mapping_type, draft_value, discord_role_id, discord_role_name')
      .eq('club_id', clubId),
  ])

  const profile = profileRes.data
  const member = memberRes.data
  const install = installRes.data
  const mappings = (mappingsRes.data ?? []) as RoleMapping[]

  // 2. 스킵 조건 확인
  if (!profile?.discord_user_id) {
    return { success: true, skipped: 'Discord 미연결 (discord_user_id 없음)' }
  }
  if (!install) {
    return { success: true, skipped: '이 클럽에 Discord 봇이 설치되지 않음' }
  }
  if (!member) {
    return { success: true, skipped: '이 클럽의 멤버가 아님' }
  }
  if (mappings.length === 0) {
    return { success: true, skipped: '역할 매핑이 설정되지 않음 (셋업 필요)' }
  }

  const guildId = install.discord_guild_id
  const discordUserId = profile.discord_user_id

  try {
    // 3. 닉네임 설정: "이름 | 직군"
    const posLabel = positionToNicknameLabel(profile.desired_position)
    const nickname = posLabel
      ? `${profile.nickname} | ${posLabel}`
      : profile.nickname || '멤버'

    let nicknameSet: string | undefined
    try {
      await setGuildMemberNickname(guildId, discordUserId, nickname)
      nicknameSet = nickname
    } catch (e) {
      // 닉네임 변경 실패는 치명적이지 않음 (봇보다 높은 역할의 유저일 수 있음)
      console.warn('[discord-sync] 닉네임 변경 실패:', e)
    }

    // 4. 목표 역할 계산
    const targetRoleIds = new Set<string>()

    // 4a. 직군 역할 (developer, designer, pm 등)
    const roleGroup = positionToRoleGroup(profile.desired_position)
    if (roleGroup) {
      const mapping = mappings.find(
        m => m.mapping_type === 'position' && m.draft_value === roleGroup
      )
      if (mapping) targetRoleIds.add(mapping.discord_role_id)
    }

    // 4b. 기수 역할 (1기, 2기 등)
    if (member.cohort) {
      const mapping = mappings.find(
        m => m.mapping_type === 'cohort' && m.draft_value === member.cohort
      )
      if (mapping) targetRoleIds.add(mapping.discord_role_id)
    }

    // 4c. 클럽 역할 (admin/owner → 운영진)
    if (member.role === 'admin' || member.role === 'owner') {
      const mapping = mappings.find(
        m => m.mapping_type === 'club_role' && m.draft_value === 'admin'
      )
      if (mapping) targetRoleIds.add(mapping.discord_role_id)
    }

    // 5. 현재 Discord 역할 조회
    const guildMember = await fetchGuildMember(guildId, discordUserId)
    const currentRoleIds = new Set(guildMember.roles)

    // 6. 매핑 테이블에 등록된 역할 ID 목록 (우리가 관리하는 역할만)
    const managedRoleIds = new Set(mappings.map(m => m.discord_role_id))

    // 7. Diff: 추가/제거할 역할 계산
    //    - 추가: 목표에 있지만 현재에 없는 것
    //    - 제거: 현재 있고 + 우리가 관리하는 역할인데 + 목표에 없는 것
    //    핵심: 수동 부여된 역할(managedRoleIds에 없는)은 절대 건드리지 않음
    const toAdd = [...targetRoleIds].filter(id => !currentRoleIds.has(id))
    const toRemove = [...currentRoleIds].filter(
      id => managedRoleIds.has(id) && !targetRoleIds.has(id)
    )

    // 8. Discord API 호출 (순차 — rate limit 방지)
    const rolesAdded: string[] = []
    const rolesRemoved: string[] = []

    for (const roleId of toAdd) {
      try {
        await addGuildMemberRole(guildId, discordUserId, roleId)
        rolesAdded.push(roleId)
      } catch (e) {
        console.warn(`[discord-sync] 역할 부여 실패 (${roleId}):`, e)
      }
    }

    for (const roleId of toRemove) {
      try {
        await removeGuildMemberRole(guildId, discordUserId, roleId)
        rolesRemoved.push(roleId)
      } catch (e) {
        console.warn(`[discord-sync] 역할 제거 실패 (${roleId}):`, e)
      }
    }

    return {
      success: true,
      nicknameSet,
      rolesAdded,
      rolesRemoved,
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[discord-sync] 싱크 실패:', { clubId, userId, error: msg })
    return { success: false, error: msg }
  }
}

/**
 * 클럽 전체 멤버를 Discord에 벌크 싱크한다.
 * rate limit 방지를 위해 1초 간격으로 처리.
 * 관리자 대시보드의 "전체 싱크" 버튼용.
 */
export async function syncAllClubMembers(
  clubId: string
): Promise<{ total: number; synced: number; skipped: number; errors: number }> {
  const supabase = createAdminClient()

  const { data: members } = await supabase
    .from('club_members')
    .select('user_id')
    .eq('club_id', clubId)
    .not('user_id', 'is', null)

  if (!members || members.length === 0) {
    return { total: 0, synced: 0, skipped: 0, errors: 0 }
  }

  let synced = 0
  let skipped = 0
  let errors = 0

  for (const member of members) {
    const result = await syncMemberToDiscord(clubId, member.user_id!)

    if (result.skipped) skipped++
    else if (result.success) synced++
    else errors++

    // rate limit 방지: 1초 대기
    if (members.indexOf(member) < members.length - 1) {
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  return { total: members.length, synced, skipped, errors }
}
