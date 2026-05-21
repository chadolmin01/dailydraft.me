/**
 * 클럽 Discord 서버 프로비저닝
 *
 * 봇 설치 후 온보딩 완료 시 호출.
 * server-template.ts의 GUILD_TEMPLATE대로 카테고리/채널을 생성하고,
 * file_tracking_enabled 채널을 discord_team_channels에 자동 등록.
 *
 * 이미 존재하는 채널(이름 기준)은 건너뛰고 없는 것만 생성.
 * → 기존 서버에 봇을 추가해도 안전하게 동작
 */

import {
  createGuildChannel,
  editChannelPermissions,
  fetchGuildChannels,
  type DiscordPermissionOverwrite,
} from './client';
import { createAdminClient } from '@/src/lib/supabase/admin';
import {
  GUILD_TEMPLATE,
  type CategoryTemplate,
  type ChannelTemplate,
  type ChannelAccess,
} from './server-template';

// Discord 권한 비트
const PERMS = {
  VIEW_CHANNEL: 1n << 10n,
  SEND_MESSAGES: 1n << 11n,
  SEND_MESSAGES_IN_THREADS: 1n << 38n,
  CREATE_PUBLIC_THREADS: 1n << 35n,
  READ_MESSAGE_HISTORY: 1n << 16n,
  ADD_REACTIONS: 1n << 6n,
  ATTACH_FILES: 1n << 15n,
  USE_EXTERNAL_EMOJIS: 1n << 18n,
  MANAGE_THREADS: 1n << 34n,
};

// 부원 기본 권한 합산
const MEMBER_ALLOW = (
  PERMS.VIEW_CHANNEL |
  PERMS.SEND_MESSAGES |
  PERMS.READ_MESSAGE_HISTORY |
  PERMS.ADD_REACTIONS |
  PERMS.ATTACH_FILES |
  PERMS.USE_EXTERNAL_EMOJIS |
  PERMS.SEND_MESSAGES_IN_THREADS |
  PERMS.CREATE_PUBLIC_THREADS
).toString();

// 읽기 전용 권한
const READ_ONLY_ALLOW = (
  PERMS.VIEW_CHANNEL |
  PERMS.READ_MESSAGE_HISTORY |
  PERMS.ADD_REACTIONS
).toString();

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * access 프리셋 → Discord permission_overwrites 변환
 *
 * @param everyoneRoleId - @everyone 역할 ID (= guild ID)
 * @param botUserId - 봇 유저 ID (bot_only 채널에서 쓰기 권한용)
 */
function buildOverwrites(
  access: ChannelAccess,
  everyoneRoleId: string,
  botUserId?: string
): DiscordPermissionOverwrite[] {
  switch (access) {
    case 'everyone':
      // 기본 — 별도 오버라이드 불필요 (카테고리 권한 상속)
      return [];

    case 'everyone_read':
      // @everyone: 읽기만, 쓰기 금지
      return [
        {
          id: everyoneRoleId,
          type: 0,
          allow: READ_ONLY_ALLOW,
          deny: PERMS.SEND_MESSAGES.toString(),
        },
      ];

    case 'admin_only':
      // @everyone: 보기 금지 (운영진 Role은 서버 관리자 권한으로 자동 접근)
      return [
        {
          id: everyoneRoleId,
          type: 0,
          allow: '0',
          deny: PERMS.VIEW_CHANNEL.toString(),
        },
      ];

    case 'bot_only':
      // @everyone: 읽기만, 봇: 쓰기 가능
      const overwrites: DiscordPermissionOverwrite[] = [
        {
          id: everyoneRoleId,
          type: 0,
          allow: READ_ONLY_ALLOW,
          deny: PERMS.SEND_MESSAGES.toString(),
        },
      ];
      if (botUserId) {
        overwrites.push({
          id: botUserId,
          type: 1, // 1 = user overwrite
          allow: MEMBER_ALLOW,
          deny: '0',
        });
      }
      return overwrites;

    default:
      return [];
  }
}

export interface ProvisionClubResult {
  created: { name: string; id: string; type: number }[];
  skipped: string[];  // 이미 존재해서 건너뛴 채널명
  registered: number; // discord_team_channels에 등록된 수
}

/**
 * 클럽 서버 프로비저닝 실행
 *
 * GUILD_TEMPLATE대로 카테고리/채널 생성 + file_tracking 채널 DB 등록
 * 이미 존재하는 채널(이름 매칭)은 건너뜀
 *
 * @param guildId - Discord 서버 ID
 * @param clubId - Draft 클럽 ID
 * @param botUserId - 봇 유저 ID (bot_only 채널 권한용)
 */
export async function provisionClubServer(
  guildId: string,
  clubId: string,
  botUserId?: string
): Promise<ProvisionClubResult> {
  const admin = createAdminClient();
  const everyoneRoleId = guildId; // Discord 규칙: @everyone role ID = guild ID

  // 기존 채널 목록 조회 (이름 중복 방지)
  const existingChannels = await fetchGuildChannels(guildId);
  const existingNames = new Set(
    (existingChannels ?? []).map((c: any) => c.name.toLowerCase())
  );
  // 기존 카테고리 매핑 (이름 → ID)
  const existingCategories = new Map<string, string>();
  for (const ch of existingChannels ?? []) {
    if (ch.type === 4) {
      existingCategories.set(ch.name.toLowerCase(), ch.id);
    }
  }

  const result: ProvisionClubResult = { created: [], skipped: [], registered: 0 };

  for (const category of GUILD_TEMPLATE) {
    const categoryName = `${category.emoji} ${category.name}`;
    let categoryId: string;

    // 카테고리 생성 또는 기존 것 사용
    const existingCatId = existingCategories.get(category.name.toLowerCase())
      ?? existingCategories.get(categoryName.toLowerCase());

    if (existingCatId) {
      categoryId = existingCatId;
      result.skipped.push(categoryName);
    } else {
      const created = await createGuildChannel(guildId, categoryName, { type: 4 });
      categoryId = created.id;
      result.created.push({ name: categoryName, id: created.id, type: 4 });
      await sleep(500);
    }

    // 채널 생성
    for (const ch of category.channels) {
      if (existingNames.has(ch.name.toLowerCase())) {
        result.skipped.push(ch.name);

        // 이미 존재하더라도 file_tracking 채널이면 DB 등록 시도
        if (ch.fileTracking) {
          const existingCh = (existingChannels ?? []).find(
            (c: any) => c.name.toLowerCase() === ch.name.toLowerCase()
          );
          if (existingCh) {
            await registerTrackedChannel(admin, {
              clubId,
              channelId: existingCh.id,
              channelName: ch.name,
              channelType: ch.type,
              categoryId,
            });
            result.registered++;
          }
        }
        continue;
      }

      const overwrites = buildOverwrites(ch.access, everyoneRoleId, botUserId);

      const channelOptions: Parameters<typeof createGuildChannel>[2] = {
        type: ch.type,
        parent_id: categoryId,
        topic: ch.topic,
        permission_overwrites: overwrites.length > 0 ? overwrites : undefined,
        available_tags: ch.type === 15 && ch.forumTags
          ? ch.forumTags.map((name) => ({ name, moderated: false }))
          : undefined,
      };

      try {
        const created = await createGuildChannel(guildId, ch.name, channelOptions);
        result.created.push({ name: ch.name, id: created.id, type: ch.type });

        // file_tracking 채널이면 DB에 등록
        if (ch.fileTracking) {
          await registerTrackedChannel(admin, {
            clubId,
            channelId: created.id,
            channelName: ch.name,
            channelType: ch.type,
            categoryId,
          });
          result.registered++;
        }

        await sleep(500); // Discord rate limit 방지
      } catch (err) {
        console.error(`[ProvisionClub] 채널 생성 실패: ${ch.name}`, err);
      }
    }
  }

  console.log(
    `[ProvisionClub] 완료: ${result.created.length}개 생성, ${result.skipped.length}개 스킵, ${result.registered}개 FileTrail 등록`
  );

  return result;
}

/**
 * file_tracking 채널을 discord_team_channels에 등록
 * 이미 존재하면 file_tracking_enabled만 true로 업데이트
 */
async function registerTrackedChannel(
  admin: ReturnType<typeof createAdminClient>,
  params: {
    clubId: string;
    channelId: string;
    channelName: string;
    channelType: number;
    categoryId: string;
  }
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('discord_team_channels')
    .upsert(
      {
        club_id: params.clubId,
        discord_channel_id: params.channelId,
        discord_channel_name: params.channelName,
        channel_type: params.channelType,
        file_tracking_enabled: true,
        discord_category_id: params.categoryId,
      },
      { onConflict: 'discord_channel_id' }
    );

  if (error) {
    console.error(`[ProvisionClub] DB 등록 실패: ${params.channelName}`, error.message);
  }
}
