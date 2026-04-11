/**
 * Discord REST API 클라이언트 (Bot 토큰 사용)
 *
 * 별도 라이브러리(discord.js) 없이 REST API만 사용한다.
 * 이유: 상시 WebSocket 연결 불필요 — 주 1회 메시지 fetch만 하면 되므로
 * discord.js의 Gateway 연결은 오버킬. REST만으로 충분.
 */

const DISCORD_API = 'https://discord.com/api/v10'
const TIMEOUT_MS = 10_000

function getBotToken(): string {
  const token = process.env.DISCORD_BOT_TOKEN
  if (!token) throw new Error('DISCORD_BOT_TOKEN 환경변수가 설정되지 않았습니다')
  return token
}

async function discordFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${DISCORD_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bot ${getBotToken()}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Discord API ${res.status}: ${body}`)
  }

  // 204 No Content (역할 부여/제거, 닉네임 변경 등)
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

// ── 타입 ──

export interface DiscordMessage {
  id: string
  content: string
  author: {
    id: string
    username: string
    global_name?: string
    bot?: boolean
  }
  timestamp: string
  attachments: { url: string; filename: string; content_type?: string; size?: number }[]
  embeds: unknown[]
}

export interface DiscordChannel {
  id: string
  name: string
  type: number // 0 = text
  guild_id: string
}

export interface DiscordGuild {
  id: string
  name: string
  icon: string | null
}

// ── API 함수 ──

/**
 * 채널의 메시지 히스토리를 가져온다.
 * after: 이 message ID 이후의 메시지만 (페이징/중복 방지)
 * limit: 최대 100 (Discord API 제한)
 *
 * 1주일치 메시지를 전부 가져오려면 여러 번 호출해야 할 수 있음.
 * 이 함수는 자동으로 페이징하여 최대 maxMessages개까지 수집한다.
 */
export async function fetchChannelMessages(
  channelId: string,
  options?: {
    after?: string
    maxMessages?: number
  }
): Promise<DiscordMessage[]> {
  const maxMessages = options?.maxMessages ?? 500
  const allMessages: DiscordMessage[] = []
  let afterId = options?.after

  while (allMessages.length < maxMessages) {
    const limit = Math.min(100, maxMessages - allMessages.length)
    const params = new URLSearchParams({ limit: String(limit) })
    if (afterId) params.set('after', afterId)

    const batch = await discordFetch<DiscordMessage[]>(
      `/channels/${channelId}/messages?${params}`
    )

    if (batch.length === 0) break

    // Discord는 최신순으로 반환하므로 역순 정렬 (오래된 것 먼저)
    batch.sort((a, b) => a.id.localeCompare(b.id))
    allMessages.push(...batch)

    // 다음 페이지의 시작점
    afterId = batch[batch.length - 1].id

    // 100개 미만이면 더 이상 없음
    if (batch.length < limit) break
  }

  return allMessages
}

/** 서버(길드)의 채널 목록 */
export async function fetchGuildChannels(guildId: string): Promise<DiscordChannel[]> {
  return discordFetch<DiscordChannel[]>(`/guilds/${guildId}/channels`)
}

/** 서버(길드) 정보 */
export async function fetchGuild(guildId: string): Promise<DiscordGuild> {
  return discordFetch<DiscordGuild>(`/guilds/${guildId}`)
}

/** 봇이 참여한 서버 목록 */
export async function fetchBotGuilds(): Promise<DiscordGuild[]> {
  return discordFetch<DiscordGuild[]>('/users/@me/guilds')
}

/** 채널의 핀 메시지 조회 — 주요 결정사항 수집용 */
export async function fetchPinnedMessages(channelId: string): Promise<DiscordMessage[]> {
  return discordFetch<DiscordMessage[]>(`/channels/${channelId}/pins`)
}

/** 특정 메시지의 리액션 조회 */
export async function fetchMessageReactions(
  channelId: string,
  messageId: string,
  emoji: string
): Promise<{ id: string; username: string }[]> {
  return discordFetch(`/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`)
}

/** 채널에 메시지 발송 (봇 프롬프트용) */
export async function sendChannelMessage(
  channelId: string,
  content: string
): Promise<DiscordMessage> {
  return discordFetch<DiscordMessage>(`/channels/${channelId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}

/** 채널에 Embed 메시지 발송 — 구조화된 카드 UI */
export async function sendChannelEmbed(
  channelId: string,
  payload: {
    content?: string
    embeds: DiscordEmbed[]
  }
): Promise<DiscordMessage> {
  return discordFetch<DiscordMessage>(`/channels/${channelId}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/** 기존 메시지에 스레드 생성 */
export async function createMessageThread(
  channelId: string,
  messageId: string,
  name: string
): Promise<{ id: string; name: string }> {
  return discordFetch(`/channels/${channelId}/messages/${messageId}/threads`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      auto_archive_duration: 10080, // 7일
    }),
  })
}

export interface DiscordEmbed {
  title?: string
  description?: string
  color?: number
  fields?: { name: string; value: string; inline?: boolean }[]
  footer?: { text: string }
  timestamp?: string
}

/**
 * 포럼 채널의 활성 스레드(포스트) 목록 조회
 * Discord API: GET /channels/{channel_id}/threads/archived/public은 아카이브된 것만 반환하므로
 * 길드 전체 활성 스레드에서 해당 채널의 것을 필터링한다.
 */
export async function fetchForumActiveThreads(
  guildId: string,
  forumChannelId: string
): Promise<{ id: string; name: string; parent_id: string }[]> {
  const data = await discordFetch<{
    threads: { id: string; name: string; parent_id: string }[]
  }>(`/guilds/${guildId}/threads/active`)

  return data.threads.filter((t) => t.parent_id === forumChannelId)
}

/** 포럼 채널에 스레드(포스트) 생성 */
export async function createForumThread(
  channelId: string,
  name: string,
  content: string,
  appliedTags?: string[]
): Promise<{ id: string; name: string }> {
  return discordFetch(`/channels/${channelId}/threads`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      message: { content },
      auto_archive_duration: 10080, // 7일
      ...(appliedTags ? { applied_tags: appliedTags } : {}),
    }),
  })
}

/** 유저에게 DM 발송 */
export async function sendDirectMessage(
  userId: string,
  content: string
): Promise<void> {
  // 1. DM 채널 열기
  const channel = await discordFetch<{ id: string }>('/users/@me/channels', {
    method: 'POST',
    body: JSON.stringify({ recipient_id: userId }),
  })

  // 2. 메시지 발송
  await discordFetch(`/channels/${channel.id}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}

// ── 길드 멤버 관리 (온보딩 싱크용) ──

export interface DiscordGuildMember {
  user?: { id: string; username: string }
  nick: string | null
  roles: string[]
  joined_at: string
}

export interface DiscordRole {
  id: string
  name: string
  color: number
  position: number
  permissions: string
  managed: boolean  // 봇/연동이 관리하는 역할인지
}

/** 길드 멤버 정보 조회 (현재 역할, 닉네임 등) */
export async function fetchGuildMember(
  guildId: string,
  userId: string
): Promise<DiscordGuildMember> {
  return discordFetch<DiscordGuildMember>(
    `/guilds/${guildId}/members/${userId}`
  )
}

/** 길드의 전체 역할 목록 조회 */
export async function fetchGuildRoles(guildId: string): Promise<DiscordRole[]> {
  return discordFetch<DiscordRole[]>(`/guilds/${guildId}/roles`)
}

/**
 * 길드에 새 역할 생성 (초기 셋업용)
 * 봇이 MANAGE_ROLES 권한 필요
 */
export async function createGuildRole(
  guildId: string,
  name: string,
  options?: { color?: number }
): Promise<DiscordRole> {
  return discordFetch<DiscordRole>(`/guilds/${guildId}/roles`, {
    method: 'POST',
    body: JSON.stringify({ name, color: options?.color ?? 0 }),
  })
}

/**
 * 멤버 닉네임 변경
 * 32자 제한. 봇이 MANAGE_NICKNAMES 권한 필요.
 * 봇보다 높은 역할의 유저는 변경 불가 (Discord 제한).
 */
export async function setGuildMemberNickname(
  guildId: string,
  userId: string,
  nickname: string
): Promise<void> {
  await discordFetch<void>(
    `/guilds/${guildId}/members/${userId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ nick: nickname.slice(0, 32) }),
    }
  )
}

/** 멤버에게 역할 부여 (204 No Content 응답) */
export async function addGuildMemberRole(
  guildId: string,
  userId: string,
  roleId: string
): Promise<void> {
  await discordFetch<void>(
    `/guilds/${guildId}/members/${userId}/roles/${roleId}`,
    { method: 'PUT' }
  )
}

/** 멤버에서 역할 제거 (204 No Content 응답) */
export async function removeGuildMemberRole(
  guildId: string,
  userId: string,
  roleId: string
): Promise<void> {
  await discordFetch<void>(
    `/guilds/${guildId}/members/${userId}/roles/${roleId}`,
    { method: 'DELETE' }
  )
}

/**
 * 글로벌 슬래시 커맨드 등록 (1회성 셋업)
 * Discord Application ID + Bot Token 필요
 */
export async function registerGlobalCommand(
  applicationId: string,
  command: { name: string; description: string; type?: number; options?: unknown[] }
): Promise<unknown> {
  return discordFetch(`/applications/${applicationId}/commands`, {
    method: 'POST',
    body: JSON.stringify(command),
  })
}

/** 유저에게 임베드 + 버튼이 포함된 DM 발송 */
export async function sendDirectMessageWithEmbed(
  userId: string,
  payload: {
    content?: string
    embeds?: unknown[]
    components?: unknown[]
  }
): Promise<void> {
  const channel = await discordFetch<{ id: string }>('/users/@me/channels', {
    method: 'POST',
    body: JSON.stringify({ recipient_id: userId }),
  })

  await discordFetch(`/channels/${channel.id}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
