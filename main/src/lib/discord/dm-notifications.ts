/**
 * Discord DM 알림 — 커피챗, 프로젝트 초대 등 개인 이벤트를 DM으로 전달
 *
 * 클럽 웹훅이 아닌 개인 DM을 사용하는 이유:
 * 커피챗/초대는 클럽 내부 활동이 아니라 유저 간 1:1 상호작용이므로
 * 클럽 Discord 채널에 보내면 범위가 맞지 않음.
 * discord_user_id가 없으면 조용히 스킵 (인앱 알림이 fallback).
 */

import { sendDirectMessageWithEmbed } from './client'
import { createAdminClient } from '@/src/lib/supabase/admin'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://draft.im'

// Discord 임베드 색상
const COLORS = {
  coffeChat: 0xf59e0b,   // amber-500 (커피 느낌)
  invitation: 0x6366f1,  // indigo-500 (브랜드)
  accepted: 0x22c55e,    // green-500
  declined: 0xef4444,    // red-500
} as const

/**
 * Supabase user ID → Discord user ID 조회
 * 없으면 null (Discord 미연결 유저)
 */
async function getDiscordUserId(userId: string): Promise<string | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('profiles')
    .select('discord_user_id')
    .eq('user_id', userId)
    .single()
  return data?.discord_user_id || null
}

/**
 * 안전하게 DM 발송 — 실패해도 throw하지 않음 (알림은 부가 기능)
 * 반환값: 'sent' | 'blocked' | 'error'
 * - blocked: 유저가 봇 DM을 차단했거나 DM을 허용하지 않음 (403)
 */
async function safeSendDM(
  discordUserId: string,
  payload: { embeds: unknown[]; components?: unknown[] }
): Promise<'sent' | 'blocked' | 'error'> {
  try {
    await sendDirectMessageWithEmbed(discordUserId, payload)
    return 'sent'
  } catch (err) {
    // Discord 403 = DM 차단 또는 "서버 멤버가 아닌 유저에게 DM 불가"
    const errMsg = String(err)
    if (errMsg.includes('403') || errMsg.includes('Cannot send messages to this user')) {
      console.warn('[discord-dm] DM 차단됨', { discordUserId })
      return 'blocked'
    }
    console.warn('[discord-dm] 발송 실패 (무시)', { discordUserId, err })
    return 'error'
  }
}

/**
 * DM 발송 결과를 인앱 알림 metadata에 기록
 * - sent: "Discord DM 전송됨" 표시
 * - blocked: "Discord DM 차단됨" 표시 → 유저가 설정 확인 필요
 */
async function markNotificationDmStatus(
  userId: string,
  notificationType: string,
  status: 'sent' | 'blocked'
): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('event_notifications')
      .select('id, metadata')
      .eq('user_id', userId)
      .eq('notification_type', notificationType)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (data) {
      const metadata = (data.metadata as Record<string, string> | null) || {}
      await supabase
        .from('event_notifications')
        .update({
          metadata: {
            ...metadata,
            discord_dm_sent: status === 'sent' ? 'true' : 'blocked',
          },
        } as never)
        .eq('id', data.id)
    }
  } catch {
    // 메타데이터 업데이트 실패는 무시
  }
}

// ── 커피챗 ──

/** 커피챗 요청 DM (프로젝트 오너에게) */
export async function dmCoffeeChatRequest(
  ownerId: string,
  requesterName: string,
  projectTitle: string
): Promise<void> {
  const discordId = await getDiscordUserId(ownerId)
  if (!discordId) return

  const result = await safeSendDM(discordId, {
    embeds: [{
      title: '☕ 커피챗 요청',
      description: `**${requesterName}**님이 "${projectTitle}" 관련 커피챗을 요청했습니다.`,
      color: COLORS.coffeChat,
      fields: [
        { name: '확인하기', value: `[Draft에서 보기](${APP_URL}/profile?tab=coffee-chats)`, inline: true },
      ],
      footer: { text: 'Draft' },
    }],
  })
  if (result !== 'error') await markNotificationDmStatus(ownerId, 'coffee_chat', result)
}

/** 개인 커피챗 요청 DM */
export async function dmPersonCoffeeChatRequest(
  targetUserId: string,
  requesterName: string
): Promise<void> {
  const discordId = await getDiscordUserId(targetUserId)
  if (!discordId) return

  const result = await safeSendDM(discordId, {
    embeds: [{
      title: '☕ 커피챗 요청',
      description: `**${requesterName}**님이 커피챗을 요청했습니다.`,
      color: COLORS.coffeChat,
      fields: [
        { name: '확인하기', value: `[Draft에서 보기](${APP_URL}/profile?tab=coffee-chats)`, inline: true },
      ],
      footer: { text: 'Draft' },
    }],
  })
  if (result !== 'error') await markNotificationDmStatus(targetUserId, 'coffee_chat', result)
}

/** 커피챗 수락/거절 DM (요청자에게) */
export async function dmCoffeeChatResponse(
  requesterId: string,
  ownerName: string,
  projectTitle: string,
  accepted: boolean
): Promise<void> {
  const discordId = await getDiscordUserId(requesterId)
  if (!discordId) return

  const result = await safeSendDM(discordId, {
    embeds: [{
      title: accepted ? '☕ 커피챗 수락' : '☕ 커피챗 결과',
      description: accepted
        ? `**${ownerName}**님이 "${projectTitle}" 커피챗을 수락했습니다. 연락처를 확인하세요!`
        : `**${ownerName}**님이 "${projectTitle}" 커피챗을 거절했습니다.`,
      color: accepted ? COLORS.accepted : COLORS.declined,
      fields: [
        { name: '확인하기', value: `[Draft에서 보기](${APP_URL}/profile?tab=coffee-chats)`, inline: true },
      ],
      footer: { text: 'Draft' },
    }],
  })
  if (result !== 'error') await markNotificationDmStatus(requesterId, 'coffee_chat', result)
}

/** 개인 커피챗 수락/거절 DM */
export async function dmPersonCoffeeChatResponse(
  requesterId: string,
  targetName: string,
  accepted: boolean
): Promise<void> {
  const discordId = await getDiscordUserId(requesterId)
  if (!discordId) return

  const result = await safeSendDM(discordId, {
    embeds: [{
      title: accepted ? '☕ 커피챗 수락' : '☕ 커피챗 결과',
      description: accepted
        ? `**${targetName}**님이 커피챗을 수락했습니다. 연락처를 확인하세요!`
        : `**${targetName}**님이 커피챗을 거절했습니다.`,
      color: accepted ? COLORS.accepted : COLORS.declined,
      fields: [
        { name: '확인하기', value: `[Draft에서 보기](${APP_URL}/profile?tab=coffee-chats)`, inline: true },
      ],
      footer: { text: 'Draft' },
    }],
  })
  if (result !== 'error') await markNotificationDmStatus(requesterId, 'coffee_chat', result)
}

// ── 프로젝트 초대 ──

/** 프로젝트 초대 DM (초대받는 사람에게) */
export async function dmProjectInvitation(
  invitedUserId: string,
  inviterName: string,
  projectTitle: string,
  role: string
): Promise<void> {
  const discordId = await getDiscordUserId(invitedUserId)
  if (!discordId) return

  const result = await safeSendDM(discordId, {
    embeds: [{
      title: '📩 프로젝트 초대',
      description: `**${inviterName}**님이 "${projectTitle}" 프로젝트에 **${role}** 역할로 초대했습니다.`,
      color: COLORS.invitation,
      fields: [
        { name: '확인하기', value: `[Draft에서 보기](${APP_URL}/profile?tab=invitations)`, inline: true },
      ],
      footer: { text: 'Draft' },
    }],
  })
  if (result !== 'error') await markNotificationDmStatus(invitedUserId, 'project_invitation', result)
}

/** 초대 수락/거절 DM (초대한 사람에게) */
export async function dmInvitationResponse(
  inviterId: string,
  invitedName: string,
  projectTitle: string,
  accepted: boolean
): Promise<void> {
  const discordId = await getDiscordUserId(inviterId)
  if (!discordId) return

  const result = await safeSendDM(discordId, {
    embeds: [{
      title: accepted ? '🎉 초대 수락' : '📩 초대 결과',
      description: accepted
        ? `**${invitedName}**님이 "${projectTitle}" 초대를 수락했습니다!`
        : `**${invitedName}**님이 "${projectTitle}" 초대를 거절했습니다.`,
      color: accepted ? COLORS.accepted : COLORS.declined,
      fields: [
        { name: '확인하기', value: `[Draft에서 보기](${APP_URL}/profile?tab=invitations)`, inline: true },
      ],
      footer: { text: 'Draft' },
    }],
  })
  if (result !== 'error') await markNotificationDmStatus(inviterId, 'project_invitation', result)
}
