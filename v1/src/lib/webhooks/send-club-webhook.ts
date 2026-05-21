/**
 * 클럽의 등록된 웹훅 채널로 이벤트를 발송하는 공통 함수.
 *
 * 흐름:
 * 1. opportunity_id → club_id 조회
 * 2. club_notification_channels에서 해당 이벤트 타입이 활성화된 채널 조회
 * 3. 채널 타입별 어댑터 호출 (현재 discord_webhook만)
 *
 * 의도: 개별 알림 코드가 채널 타입을 몰라도 되게 추상화.
 * 나중에 slack_webhook 추가 시 이 파일의 switch문만 확장하면 됨.
 */

import { createAdminClient } from '@/src/lib/supabase/admin'
import {
  notifyDiscordUpdatePosted,
  notifyDiscordUpdateRemind,
  notifyDiscordAnnouncement,
} from './discord'
import {
  notifySlackUpdatePosted,
  notifySlackUpdateRemind,
  notifySlackAnnouncement,
} from './slack'

type WebhookEventType = 'update_posted' | 'update_remind' | 'announcement'

interface ChannelRow {
  id: string
  channel_type: string
  webhook_url: string
  event_types: string[]
  enabled: boolean
}

/**
 * 클럽에 등록된 모든 활성 웹훅 채널을 가져온다.
 * event_types 필터: 빈 배열이면 전체 이벤트, 아니면 해당 이벤트만.
 */
async function getClubWebhookChannels(
  clubId: string,
  eventType: WebhookEventType
): Promise<ChannelRow[]> {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('club_notification_channels')
    .select('id, channel_type, webhook_url, event_types, enabled')
    .eq('club_id', clubId)
    .eq('enabled', true)

  if (error || !data) return []

  // event_types 필터링: 배열에 해당 이벤트가 포함되어 있거나 빈 배열이면 통과
  return (data as ChannelRow[]).filter(
    (ch) => ch.event_types.length === 0 || ch.event_types.includes(eventType)
  )
}

/**
 * opportunity_id로 club_id를 조회한다.
 * club_id가 없는 프로젝트(개인 프로젝트)면 null 반환.
 */
async function getClubIdFromOpportunity(opportunityId: string): Promise<string | null> {
  const admin = createAdminClient()

  const { data } = await admin
    .from('opportunities')
    .select('club_id')
    .eq('id', opportunityId)
    .single()

  return (data as { club_id: string | null } | null)?.club_id ?? null
}

/** 주간 업데이트 작성 시 클럽 웹훅으로 알림 */
export async function sendClubUpdatePostedWebhook(params: {
  opportunityId: string
  authorName: string
  projectTitle: string
  updateTitle: string
  updateType: string
  weekNumber: number
}): Promise<void> {
  const clubId = await getClubIdFromOpportunity(params.opportunityId)
  if (!clubId) return

  const channels = await getClubWebhookChannels(clubId, 'update_posted')
  if (channels.length === 0) return

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://draft.is'

  await Promise.allSettled(
    channels.map((ch) => {
      switch (ch.channel_type) {
        case 'discord_webhook':
          return notifyDiscordUpdatePosted(ch.webhook_url, {
            ...params,
            projectUrl: `${baseUrl}/p/${params.opportunityId}`,
          })
        case 'slack_webhook':
          return notifySlackUpdatePosted(ch.webhook_url, {
            ...params,
            projectUrl: `${baseUrl}/p/${params.opportunityId}`,
          })
        default:
          return Promise.resolve(false)
      }
    })
  )
}

/** 미작성 리마인드를 클럽 웹훅으로 발송 */
export async function sendClubUpdateRemindWebhook(params: {
  clubId: string
  teamNames: string[]
  weekNumber: number
}): Promise<void> {
  const channels = await getClubWebhookChannels(params.clubId, 'update_remind')
  if (channels.length === 0) return

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://draft.is'

  await Promise.allSettled(
    channels.map((ch) => {
      switch (ch.channel_type) {
        case 'discord_webhook':
          return notifyDiscordUpdateRemind(ch.webhook_url, {
            ...params,
            draftUrl: baseUrl,
          })
        case 'slack_webhook':
          return notifySlackUpdateRemind(ch.webhook_url, {
            ...params,
            draftUrl: baseUrl,
          })
        default:
          return Promise.resolve(false)
      }
    })
  )
}

/** 공지를 클럽 웹훅으로 발송 */
export async function sendClubAnnouncementWebhook(params: {
  clubId: string
  title: string
  content: string
  authorName: string
}): Promise<void> {
  const channels = await getClubWebhookChannels(params.clubId, 'announcement')
  if (channels.length === 0) return

  await Promise.allSettled(
    channels.map((ch) => {
      switch (ch.channel_type) {
        case 'discord_webhook':
          return notifyDiscordAnnouncement(ch.webhook_url, params)
        case 'slack_webhook':
          return notifySlackAnnouncement(ch.webhook_url, params)
        default:
          return Promise.resolve(false)
      }
    })
  )
}
