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

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('DISCORD_BOT_TOKEN 환경변수가 필요합니다');
  process.exit(1);
}

const engine = new BotEngine();

const gateway = new DiscordGateway(BOT_TOKEN, {
  onReady: (data) => {
    const guildNames = data.guilds.map((g: any) => g.id).join(', ');
    console.log(`[Bot] 준비 완료 — 서버: ${guildNames}`);
    console.log('[Bot] 3계층 감지 활성:');
    console.log('  - 슬래시 커맨드: /마무리, /투표, /일정');
    console.log('  - 즉시 감지: 투표·블로커·질문·일정');
    console.log('  - 마무리 요약: 종결 신호 or /마무리');
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

  onReactionAdd: (data) => {
    // 봇 자신의 리액션은 무시
    if (data.user_id === data.member?.user?.id) return;

    const emoji = data.emoji?.name;
    if (emoji === '❌') {
      // dismiss 추적 — 나중에 pattern type 매핑 필요
      // 현재는 로깅만
      console.log(`[Bot] ❌ dismiss — channel: ${data.channel_id}, msg: ${data.message_id}`);
    }
    if (emoji === '✅') {
      console.log(`[Bot] ✅ accept — channel: ${data.channel_id}, msg: ${data.message_id}`);
    }
  },

  onError: (error) => {
    console.error('[Bot] 치명적 오류:', error.message);
    process.exit(1);
  },
});

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
