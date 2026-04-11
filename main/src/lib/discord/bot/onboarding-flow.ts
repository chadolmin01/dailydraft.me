/**
 * Discord 봇 온보딩 플로우
 *
 * 봇이 서버에 초대되면 자동으로 시작되는 세팅 과정.
 * 운영자와 DM으로 3단계 이모지 세팅을 진행한 뒤,
 * 고급 설정은 Draft 웹으로 안내.
 *
 * 플로우:
 * 1. GUILD_CREATE 감지 → 서버 owner에게 DM
 * 2. 채널 목록 보여주고 → 프로젝트 채널 선택
 * 3. AI 톤 선택 (합쇼체/해요체/English)
 * 4. 세팅 완료 → Draft 웹 링크 안내
 */

import {
  sendDirectMessage,
  sendDirectMessageWithEmbed,
  fetchGuildChannels,
  fetchGuild,
} from '../client';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://draft.app';

// ── 봇 초대 URL 생성 ──

/**
 * Discord 봇 초대 URL 생성
 * 필요한 권한: 메시지 읽기, 보내기, 리액션, 이벤트 생성, 스레드 관리
 */
export function getBotInviteUrl(): string {
  const appId = process.env.DISCORD_APP_ID;
  // permissions 비트마스크:
  // SEND_MESSAGES (1<<11) | ADD_REACTIONS (1<<6) | READ_MESSAGE_HISTORY (1<<16)
  // | MANAGE_EVENTS (1<<33) | CREATE_PUBLIC_THREADS (1<<35) | VIEW_CHANNEL (1<<10)
  // | USE_EXTERNAL_EMOJIS (1<<18) | SEND_MESSAGES_IN_THREADS (1<<38)
  const permissions = '397821087808';
  const scopes = 'bot%20applications.commands';

  return `https://discord.com/oauth2/authorize?client_id=${appId}&permissions=${permissions}&scope=${scopes}`;
}

// ── 1단계: 서버 초대 감지 → 환영 DM ──

/**
 * 봇이 새 서버에 추가됐을 때 호출
 * Gateway GUILD_CREATE 이벤트에서 호출
 */
export async function handleGuildJoin(guild: {
  id: string;
  name: string;
  owner_id: string;
}): Promise<void> {
  console.log(`[Onboarding] 새 서버 감지: ${guild.name} (${guild.id})`);

  // 서버 owner에게 DM으로 세팅 시작
  const welcomeMessage = [
    `👋 **${guild.name}** 서버에 Draft 봇이 설치되었습니다!`,
    '',
    '30초만에 기본 세팅을 완료할 수 있습니다.',
    '',
    '**Draft 봇이 할 수 있는 것:**',
    '• 📝 주간 업데이트 자동 생성 (팀 대화 → AI 요약)',
    '• 📊 투표/결정 자동 정리',
    '• ✅ 할 일 감지 및 추적',
    '• 📅 일정 조율 + Discord 이벤트 생성',
    '',
    '아래 반응을 눌러 세팅을 시작해주세요!',
    '🚀 = 세팅 시작',
  ].join('\n');

  await sendDirectMessage(guild.owner_id, welcomeMessage);
}

// ── 2단계: 채널 선택 ──

/**
 * 서버의 텍스트 채널 목록을 보여주고 프로젝트 채널 선택 안내
 */
export async function sendChannelSelectionMessage(
  userId: string,
  guildId: string
): Promise<void> {
  const channels = await fetchGuildChannels(guildId);
  if (!channels) {
    await sendDirectMessage(userId, '채널 목록을 불러올 수 없습니다. 권한을 확인해주세요.');
    return;
  }

  // 텍스트 채널만 필터 (type 0), 카테고리별 그룹핑
  const textChannels = channels.filter((c: any) => c.type === 0);

  // 카테고리별로 그룹핑
  const categories = new Map<string, { name: string; channels: any[] }>();
  const uncategorized: any[] = [];

  for (const ch of textChannels) {
    if (ch.parent_id) {
      const parent = channels.find((c: any) => c.id === ch.parent_id);
      if (parent) {
        if (!categories.has(parent.id)) {
          categories.set(parent.id, { name: parent.name, channels: [] });
        }
        categories.get(parent.id)!.channels.push(ch);
      } else {
        uncategorized.push(ch);
      }
    } else {
      uncategorized.push(ch);
    }
  }

  const lines: string[] = [
    '📋 **프로젝트 채널을 선택해주세요**',
    '',
    '팀별 채널을 Draft 프로젝트에 연결합니다.',
    '봇이 해당 채널의 대화를 분석하여 주간 업데이트를 만듭니다.',
    '',
  ];

  // 카테고리별 표시
  for (const [, cat] of categories) {
    lines.push(`**📁 ${cat.name}**`);
    for (const ch of cat.channels) {
      lines.push(`  #${ch.name}`);
    }
    lines.push('');
  }

  if (uncategorized.length > 0) {
    lines.push('**기타**');
    for (const ch of uncategorized) {
      lines.push(`  #${ch.name}`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('**어떻게 연결할까요?**');
  lines.push('1️⃣ = 카테고리 단위로 자동 매핑 (카테고리 안의 채널 = 각각 프로젝트)');
  lines.push('2️⃣ = 특정 채널만 선택 (Draft 웹에서 직접 선택)');
  lines.push('3️⃣ = 나중에 설정 (일단 건너뛰기)');

  await sendDirectMessage(userId, lines.join('\n'));
}

// ── 3단계: AI 톤 선택 ──

export async function sendToneSelectionMessage(
  userId: string
): Promise<void> {
  const message = [
    '🎨 **AI 톤을 선택해주세요**',
    '',
    '주간 업데이트와 봇 메시지의 톤을 설정합니다.',
    '',
    '🏢 = 합쇼체 ("작업을 완료했습니다")',
    '💬 = 해요체 ("작업을 완료했어요")',
    '🇺🇸 = English ("Completed the task")',
    '',
    '나중에 Draft 웹에서 변경할 수 있습니다.',
  ].join('\n');

  await sendDirectMessage(userId, message);
}

// ── 4단계: 세팅 완료 ──

export async function sendSetupCompleteMessage(
  userId: string,
  guildName: string,
  clubSlug: string,
  settings: {
    channelCount: number;
    tone: string;
  }
): Promise<void> {
  const toneLabel = {
    formal: '합쇼체',
    casual: '해요체',
    english: 'English',
  }[settings.tone] ?? settings.tone;

  const message = [
    '✅ **기본 세팅이 완료되었습니다!**',
    '',
    `📍 서버: ${guildName}`,
    `📋 연결된 채널: ${settings.channelCount}개`,
    `🎨 AI 톤: ${toneLabel}`,
    '',
    '**다음 주부터 자동으로:**',
    '• 월요일 — 주간 체크인 프롬프트 생성',
    '• 일요일 — AI 주간 업데이트 초안 생성',
    '• 실시간 — 투표/할일/블로커 감지',
    '',
    '**고급 설정 (선택):**',
    `🔗 ${APP_URL}/clubs/${clubSlug}/settings/discord`,
    '',
    '• Google Sheets, GitHub, Notion 연동',
    '• 봇 감지 민감도 조절',
    '• 체크인 템플릿 커스터마이징',
    '• 마감 시간, 자동 게시 설정',
    '',
    '질문이 있으면 이 DM에서 `/help`를 입력해주세요!',
  ].join('\n');

  await sendDirectMessage(userId, message);
}

// ── 자동 채널 매핑 ──

/**
 * 카테고리 안의 채널들을 자동으로 프로젝트에 매핑
 * 채널 이름 = 프로젝트 이름으로 자동 생성
 */
export async function autoMapChannels(
  guildId: string
): Promise<Array<{ channelId: string; channelName: string; categoryName?: string }>> {
  const channels = await fetchGuildChannels(guildId);
  if (!channels) return [];

  const textChannels = channels.filter((c: any) => c.type === 0);
  const categories = channels.filter((c: any) => c.type === 4);

  // 시스템 채널 제외 (일반적인 이름)
  const systemNames = new Set([
    'general', '일반', 'welcome', '공지', 'announcements',
    'rules', '규칙', 'introductions', '자기소개',
  ]);

  const mapped: Array<{
    channelId: string;
    channelName: string;
    categoryName?: string;
  }> = [];

  for (const ch of textChannels) {
    if (systemNames.has(ch.name.toLowerCase())) continue;

    const category = categories.find((c: any) => c.id === ch.parent_id);
    mapped.push({
      channelId: ch.id,
      channelName: ch.name,
      categoryName: category?.name,
    });
  }

  return mapped;
}

// ── 온보딩 상태 관리 ──

export type OnboardingStep = 'welcome' | 'channel_select' | 'tone_select' | 'complete';

export interface OnboardingState {
  guildId: string;
  guildName: string;
  ownerId: string;
  step: OnboardingStep;
  selectedChannels: string[];
  selectedTone: 'formal' | 'casual' | 'english';
  clubSlug?: string;
}

/**
 * 인메모리 온보딩 상태 관리
 * 온보딩은 짧은 과정이므로 DB 저장 불필요
 */
const onboardingSessions = new Map<string, OnboardingState>();

export function getOnboardingState(userId: string): OnboardingState | undefined {
  return onboardingSessions.get(userId);
}

export function setOnboardingState(userId: string, state: OnboardingState): void {
  onboardingSessions.set(userId, state);
}

export function clearOnboardingState(userId: string): void {
  onboardingSessions.delete(userId);
}
