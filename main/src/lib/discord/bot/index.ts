/**
 * Discord 봇 엔트리포인트
 *
 * Gateway 연결 → BotEngine으로 메시지 라우팅
 * 별도 프로세스로 실행: npx tsx src/lib/discord/bot/index.ts
 *
 * 환경변수:
 *   DISCORD_BOT_TOKEN — Discord Bot Token
 *   GEMINI_API_KEY — Gemini Flash-Lite API Key
 *   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — (선택) DB 기록용
 */

import { DiscordGateway } from './gateway';
import { BotEngine } from './bot-engine';
import {
  handleGuildJoin,
  getOnboardingState,
  setOnboardingState,
  clearOnboardingState,
  sendChannelSelectionMessage,
  sendToneSelectionMessage,
  sendSetupCompleteMessage,
  autoMapChannels,
} from './onboarding-flow';
import { updateInterventionResponse } from './db-persist';

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('DISCORD_BOT_TOKEN 환경변수가 필요합니다');
  process.exit(1);
}

const engine = new BotEngine();

// 봇 자신의 ID (READY 이벤트에서 설정)
let botUserId: string = '';
// READY에서 받은 기존 서버 ID 목록 — GUILD_CREATE에서 신규 서버만 온보딩하기 위함
const knownGuildIds = new Set<string>();

const gateway = new DiscordGateway(BOT_TOKEN, {
  onReady: (data) => {
    botUserId = data.user.id;
    const guildCount = data.guilds.length;
    // READY 시 받은 길드를 "기존 서버"로 등록
    for (const g of data.guilds) {
      knownGuildIds.add(g.id);
    }
    console.log(`[Bot] 준비 완료 — ${guildCount}개 서버, ID: ${botUserId}`);
    console.log('[Bot] 3계층 감지 활성:');
    console.log('  - 슬래시 커맨드: /마무리, /투표, /일정');
    console.log('  - 즉시 감지: 투표·블로커·질문·일정');
    console.log('  - 마무리 요약: 종결 신호 or /마무리');
    console.log('  - 온보딩: 새 서버 → 자동 세팅 DM');
  },

  onGuildCreate: async (guild) => {
    // READY 후 기존 서버도 GUILD_CREATE로 오므로, 이미 알려진 서버는 무시
    if (knownGuildIds.has(guild.id)) {
      console.log(`[Bot] 기존 서버 로드 완료: ${guild.name} (${guild.id})`);
      return;
    }
    // 진짜 새 서버 — 온보딩 시작
    knownGuildIds.add(guild.id);
    if (guild.unavailable) return;

    try {
      await handleGuildJoin({
        id: guild.id,
        name: guild.name,
        owner_id: guild.owner_id,
      });

      // 온보딩 세션 시작
      setOnboardingState(guild.owner_id, {
        guildId: guild.id,
        guildName: guild.name,
        ownerId: guild.owner_id,
        step: 'welcome',
        selectedChannels: [],
        selectedTone: 'formal',
      });
    } catch (err) {
      console.error('[Bot] 온보딩 시작 오류:', err);
    }
  },

  onMessageCreate: async (data) => {
    try {
      await engine.onMessage({
        id: data.id,
        content: data.content ?? '',
        author: {
          id: data.author.id,
          username: data.author.username ?? data.author.global_name ?? 'unknown',
          bot: data.author.bot ?? false,
        },
        timestamp: data.timestamp,
        channel_id: data.channel_id,
        guild_id: data.guild_id,
      });
    } catch (err) {
      console.error('[Bot] 메시지 처리 오류:', err);
    }
  },

  onReactionAdd: async (data) => {
    // 봇 자신의 리액션은 무시
    if (data.user_id === botUserId) return;

    const emoji = data.emoji?.name;
    if (!emoji) return;

    // 온보딩 리액션 처리
    const state = getOnboardingState(data.user_id);
    if (state) {
      try {
        await handleOnboardingReaction(data.user_id, emoji, state);
      } catch (err) {
        console.error('[Bot] 온보딩 리액션 오류:', err);
      }
      return;
    }

    // 일반 리액션 처리 → DB에 사용자 응답 기록
    // 참고: 현재 quick suggestion은 버튼(components) 기반이라 리액션으로 오지 않음
    // 여기서 처리되는 건 주로 마무리 요약의 ✅/✏️ 리액션
    if (emoji === '❌') {
      console.log(`[Bot] ❌ dismiss — channel: ${data.channel_id}, msg: ${data.message_id}`);
      updateInterventionResponse(data.message_id, 'dismissed').catch(() => {});
    }
    if (emoji === '✅') {
      console.log(`[Bot] ✅ accept — channel: ${data.channel_id}, msg: ${data.message_id}`);
      updateInterventionResponse(data.message_id, 'accepted').catch(() => {});
    }
  },

  onError: (error) => {
    console.error('[Bot] 치명적 오류:', error.message);
    process.exit(1);
  },
});

/**
 * 온보딩 리액션 처리 — 단계별 진행
 */
async function handleOnboardingReaction(
  userId: string,
  emoji: string,
  state: OnboardingState
): Promise<void> {
  const { sendDirectMessage } = await import('../client');

  switch (state.step) {
    case 'welcome':
      if (emoji === '🚀') {
        state.step = 'channel_select';
        setOnboardingState(userId, state);
        await sendChannelSelectionMessage(userId, state.guildId);
      }
      break;

    case 'channel_select':
      if (emoji === '1️⃣') {
        // 카테고리 단위 자동 매핑
        const mapped = await autoMapChannels(state.guildId);
        state.selectedChannels = mapped.map((m) => m.channelId);
        state.step = 'tone_select';
        setOnboardingState(userId, state);

        await sendDirectMessage(
          userId,
          `✅ ${mapped.length}개 채널이 자동 매핑되었습니다!\n${mapped.map((m) => `  #${m.channelName}${m.categoryName ? ` (${m.categoryName})` : ''}`).join('\n')}`
        );
        await sendToneSelectionMessage(userId);
      } else if (emoji === '2️⃣') {
        // Draft 웹에서 직접 선택
        state.step = 'tone_select';
        setOnboardingState(userId, state);
        await sendDirectMessage(
          userId,
          '채널 매핑은 Draft 웹에서 설정할 수 있습니다. 다음 단계로 넘어갑니다!'
        );
        await sendToneSelectionMessage(userId);
      } else if (emoji === '3️⃣') {
        // 건너뛰기
        state.step = 'tone_select';
        setOnboardingState(userId, state);
        await sendToneSelectionMessage(userId);
      }
      break;

    case 'tone_select':
      const toneMap: Record<string, 'formal' | 'casual' | 'english'> = {
        '🏢': 'formal',
        '💬': 'casual',
        '🇺🇸': 'english',
      };
      if (toneMap[emoji]) {
        state.selectedTone = toneMap[emoji];
        state.step = 'complete';
        setOnboardingState(userId, state);

        // TODO: DB에 설정 저장 (club_ghostwriter_settings)
        // TODO: discord_bot_installations에 기록
        // TODO: 채널 매핑을 discord_team_channels에 저장

        await sendSetupCompleteMessage(userId, state.guildName, state.clubSlug ?? 'settings', {
          channelCount: state.selectedChannels.length,
          tone: state.selectedTone,
        });

        clearOnboardingState(userId);
      }
      break;
  }
}

import type { OnboardingState } from './onboarding-flow';

// 시작
console.log('[Bot] Discord Gateway 연결 중...');
gateway.connect();

// 정기 정리 (5분마다)
setInterval(() => engine.cleanup(), 5 * 60 * 1000);

// 안전한 종료
process.on('SIGINT', () => {
  console.log('\n[Bot] 종료 중...');
  gateway.disconnect();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[Bot] SIGTERM 수신, 종료 중...');
  gateway.disconnect();
  process.exit(0);
});
