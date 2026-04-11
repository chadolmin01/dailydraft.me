/**
 * Discord REST API 액션 — 봇 엔진에서 사용하는 Discord 호출들
 * 기존 client.ts의 discordFetch를 재사용
 */

const DISCORD_API = 'https://discord.com/api/v10';
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN ?? '';

async function discordFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T | null> {
  const res = await fetch(`${DISCORD_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (res.status === 204) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[Discord API] ${res.status} ${path}: ${body}`);
    return null;
  }
  return res.json() as Promise<T>;
}

/**
 * 채널에 메시지 전송 (답장 지원)
 */
export async function sendChannelMessage(
  channelId: string,
  content: string,
  replyToMessageId?: string,
  components?: unknown[]
): Promise<{ id: string } | null> {
  const body: Record<string, unknown> = { content };

  if (replyToMessageId) {
    body.message_reference = {
      message_id: replyToMessageId,
      fail_if_not_exists: false,
    };
  }

  if (components) {
    body.components = components;
  }

  return discordFetch<{ id: string }>(`/channels/${channelId}/messages`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * 메시지에 리액션 추가
 * 커스텀 이모지가 아닌 유니코드 이모지는 URL 인코딩 필요
 */
export async function addReaction(
  channelId: string,
  messageId: string,
  emoji: string
): Promise<void> {
  const encoded = encodeURIComponent(emoji);
  await discordFetch(
    `/channels/${channelId}/messages/${messageId}/reactions/${encoded}/@me`,
    { method: 'PUT' }
  );
  // Discord rate limit 방지: 리액션 사이 400ms 딜레이
  await new Promise((r) => setTimeout(r, 400));
}

/**
 * Discord Scheduled Event 생성
 * 일정 확정 시 자동으로 이벤트 생성
 */
export async function createScheduledEvent(
  guildId: string,
  name: string,
  startTime: Date,
  endTime?: Date,
  location?: string
): Promise<{ id: string } | null> {
  return discordFetch<{ id: string }>(
    `/guilds/${guildId}/scheduled-events`,
    {
      method: 'POST',
      body: JSON.stringify({
        name,
        // entity_type 3 = EXTERNAL (장소 지정)
        entity_type: 3,
        scheduled_start_time: startTime.toISOString(),
        scheduled_end_time: (endTime ?? new Date(startTime.getTime() + 2 * 60 * 60 * 1000)).toISOString(),
        entity_metadata: {
          location: location ?? '미정',
        },
        privacy_level: 2, // GUILD_ONLY
      }),
    }
  );
}

/**
 * 메시지 핀
 */
export async function pinMessage(
  channelId: string,
  messageId: string
): Promise<void> {
  await discordFetch(`/channels/${channelId}/pins/${messageId}`, {
    method: 'PUT',
  });
}

/**
 * 특정 메시지의 리액션 목록 조회
 * 투표 결과 집계에 사용
 */
export async function getReactions(
  channelId: string,
  messageId: string,
  emoji: string
): Promise<Array<{ id: string; username: string }>> {
  const encoded = encodeURIComponent(emoji);
  const result = await discordFetch<Array<{ id: string; username: string }>>(
    `/channels/${channelId}/messages/${messageId}/reactions/${encoded}`
  );
  return result ?? [];
}
