/**
 * Discord 봇 엔진 — 메시지 수신 → 패턴 감지 → 응답의 전체 오케스트레이션
 *
 * 3계층 동작:
 * 1. 슬래시 커맨드 (/마무리, /투표, /일정) — 사용자 직접 호출
 * 2. 즉시 감지 — 투표 제안, 블로커, 질문 묻힘
 * 3. 마무리 요약 — 종결 신호 감지 시 축적된 패턴을 한번에 정리
 */

import { MessageBuffer } from './message-buffer';
import { CooldownGuard } from './cooldown-guard';
import { detectPatterns, prefilter } from './pattern-detector';
import {
  buildInstantResponse,
  buildQuickSuggestion,
  buildSummaryResponse,
  aggregateToSummary,
} from './response-builder';
import {
  sendChannelMessage,
  addReaction,
  createScheduledEvent,
} from './discord-actions';
import {
  saveIntervention,
  updateInterventionResponse,
  saveSummaryData,
} from './db-persist';
import { chatModel } from '../../ai/gemini-client';
import type {
  BufferedMessage,
  PatternDetection,
  BotConfig,
  BotResponse,
} from './types';
import { INSTANT_PATTERNS, SUMMARY_PATTERNS, DEFAULT_BOT_CONFIG } from './types';

// @멘션 대화용 시스템 프롬프트
const MENTION_SYSTEM_PROMPT = `당신은 "Draft"라는 대학교 프로젝트/동아리 관리 봇입니다.
팀원들이 @멘션으로 질문하면 도움을 줍니다.

## 성격
- 친근하지만 간결하게 답변
- 대학생 팀원처럼 자연스러운 한국어 사용
- 필요하면 이모지 적절히 사용

## 할 수 있는 것
- 최근 대화 내용 기반으로 질문에 답변
- 프로젝트 진행 관련 조언
- 슬래시 커맨드 안내 (/마무리, /투표, /일정, /투두, /회의시작, /한줄, /설정, /도움)

## 규칙
- 답변은 300자 이내로 간결하게
- 모르는 건 모른다고 솔직하게
- 최근 대화 컨텍스트가 있으면 참고하되, 없으면 일반적인 답변
- Discord 마크다운 사용 가능 (**굵게**, *기울임*, \`코드\`)`;

export class BotEngine {
  private buffer: MessageBuffer;
  private cooldown: CooldownGuard;
  private config: BotConfig;

  // 봇 자신의 Discord User ID — 멘션 감지용
  private botUserId: string = '';

  // 채널별 멘션 응답 쿨다운 (스팸 방지, 10초)
  private mentionCooldowns = new Map<string, number>();

  // 채널별 마무리 요약용 축적 패턴
  private pendingPatterns = new Map<string, PatternDetection[]>();

  // 채널별 마무리 타이머 (종결 신호 후 90초 대기)
  private summaryTimers = new Map<string, ReturnType<typeof setTimeout>>();


  constructor(config: Partial<BotConfig> = {}) {
    this.config = { ...DEFAULT_BOT_CONFIG, ...config };
    this.buffer = new MessageBuffer();
    this.cooldown = new CooldownGuard(this.config);
  }

  /** READY 이벤트에서 봇 ID 설정 — 멘션 감지에 필요 */
  setBotUserId(id: string): void {
    this.botUserId = id;
  }

  /**
   * Discord Gateway MESSAGE_CREATE 이벤트 핸들러
   * 모든 메시지가 여기를 통과
   */
  async onMessage(raw: {
    id: string;
    content: string;
    author: { id: string; username: string; bot?: boolean };
    timestamp: string;
    channel_id: string;
    guild_id: string;
  }): Promise<void> {
    // 봇 메시지 무시
    const msg = this.buffer.push(raw);
    if (!msg) return;

    // 야간 모드 제거 — 대학생/스타트업은 새벽 작업 빈번

    // @멘션 감지: <@봇ID> 가 메시지에 포함되면 AI 대화 모드
    if (this.botUserId && msg.content.includes(`<@${this.botUserId}>`)) {
      await this.handleMention(msg);
      return;
    }

    // 슬래시 커맨드 처리
    if (msg.content.startsWith('/')) {
      await this.handleSlashCommand(msg);
      return;
    }

    const messages = this.buffer.getMessages(msg.channelId);

    // 1단계: pre-filter (동기, 저비용)
    const candidates = prefilter(messages);
    if (candidates.length === 0) return;

    // 대화 종결 신호 확인
    const hasEndSignal = candidates.some(
      (c) => c.type === 'conversation-end' && c.confidence >= 0.6
    );

    // 즉시 반응 후보 확인
    const instantCandidates = candidates.filter(
      (c) =>
        INSTANT_PATTERNS.includes(c.type) &&
        c.confidence >= 0.5 &&
        this.cooldown.canTrigger(msg.channelId, c.type)
    );

    // 즉시 반응: AI 없이 prefilter만으로 빠르게 제안
    // (AI는 /마무리 요약에서만 사용 — 대화 중 느린 응답은 어색함)
    for (const candidate of instantCandidates) {
      const response = buildQuickSuggestion(candidate.type, msg.channelId);
      if (response) {
        const sentMsg = await this.sendResponse(response);
        this.cooldown.recordTrigger(msg.channelId, candidate.type);

        // DB 기록: 즉시 감지 → bot_interventions
        const detection: PatternDetection = {
          type: candidate.type,
          confidence: candidate.confidence,
          data: { type: candidate.type } as any,
          sourceMessages: messages,
        };
        saveIntervention(detection, sentMsg?.id, 'auto').catch((e) =>
          console.error('[BotEngine] intervention 저장 실패:', e)
        );

        // 제안 후 버퍼 초기화 — 같은 메시지로 재감지 방지
        this.buffer.clear(msg.channelId);
        break; // 한 번에 하나만
      }
    }

    // 종결 신호 감지 → 마무리 요약 예약
    if (hasEndSignal) {
      // 비즉시 패턴도 AI로 분석
      const allDetections = await detectPatterns(messages);
      const summaryDetections = allDetections.filter((d) =>
        SUMMARY_PATTERNS.includes(d.type)
      );
      this.accumulatePatterns(msg.channelId, summaryDetections);
      this.scheduleSummary(msg.channelId);
    }
  }

  /**
   * 슬래시 커맨드 처리
   * Discord Interaction이 아닌 일반 메시지로 /커맨드를 감지
   */
  private async handleSlashCommand(msg: BufferedMessage): Promise<void> {
    const cmd = msg.content.trim().split(/\s+/)[0].toLowerCase();

    switch (cmd) {
      case '/마무리':
        await this.triggerSummary(msg.channelId);
        break;

      case '/투표': {
        // /투표 주제 옵션1 옵션2 옵션3
        const parts = msg.content.replace('/투표', '').trim().split(/\s+/);
        if (parts.length < 2) {
          await this.sendResponse({
            content: '사용법: `/투표 주제 옵션1 옵션2 옵션3`',
            channelId: msg.channelId,
          });
          return;
        }
        const topic = parts[0];
        const options = parts.slice(1);
        const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
        const optionLines = options
          .map((opt, i) => `${emojis[i]} ${opt}`)
          .join('\n');
        await this.sendResponse({
          content: `📊 **${topic}** 투표\n\n${optionLines}`,
          channelId: msg.channelId,
          reactions: options.map((_, i) => emojis[i]),
        });
        break;
      }

      case '/일정': {
        // /일정 → When2Meet 안내 + 간단 투표
        await this.sendResponse({
          content: `📅 일정 조율\n\n**간단한 경우:** 아래에서 가능한 요일에 반응해주세요!\n1️⃣ 월  2️⃣ 화  3️⃣ 수  4️⃣ 목  5️⃣ 금\n\n**복잡한 경우:** When2Meet에서 시간 맞춰보세요!\n🔗 https://when2meet.com`,
          channelId: msg.channelId,
          reactions: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'],
        });
        break;
      }

      case '/설정': {
        // /설정 → Draft 웹 설정 페이지 링크
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://draft.app';
        await this.sendResponse({
          content: `⚙️ **Discord 연동 설정**\n\n아래 링크에서 설정을 변경할 수 있습니다:\n🔗 ${appUrl}/clubs/${msg.guildId}/settings/discord\n\n설정 항목:\n• 채널-프로젝트 매핑\n• AI 톤 (합쇼체/부드러운 합쇼체/English)\n• 체크인/초안 생성 스케줄\n• 외부 도구 연동 (GitHub, Notion 등)\n• 승인 권한`,
          channelId: msg.channelId,
        });
        break;
      }

      case '/도움':
      case '/help': {
        await this.sendResponse({
          content: `📖 **Draft 봇 명령어**\n\n**슬래시 커맨드:**\n• \`/마무리\` — 지금까지 대화 요약\n• \`/투표 주제 옵션1 옵션2\` — 투표 생성\n• \`/일정\` — 요일 투표 + When2Meet 안내\n• \`/프로필 [@유저]\` — Draft 프로필 조회\n• \`/설정\` — Draft 웹 설정 페이지 링크\n\n**대화:**\n• \`@Draft 질문\` — AI에게 질문\n\n**자동 감지:**\n• 투표/결정 제안 시 → 투표 버튼 제공\n• 블로커/막힘 감지 → 도움 제안\n• 대화 종결 시 → 회의 요약 자동 생성`,
          channelId: msg.channelId,
        });
        break;
      }
    }
  }

  /**
   * @멘션 대화 처리
   * "@Draft 오늘 할 일 뭐야?" → 최근 대화 컨텍스트 포함하여 AI 응답
   */
  private async handleMention(msg: BufferedMessage): Promise<void> {
    // 쿨다운 체크 (채널당 10초)
    const now = Date.now();
    const lastMention = this.mentionCooldowns.get(msg.channelId) ?? 0;
    if (now - lastMention < 10_000) return;
    this.mentionCooldowns.set(msg.channelId, now);

    // 멘션 제거 후 질문 추출
    const query = msg.content
      .replace(new RegExp(`<@!?${this.botUserId}>`, 'g'), '')
      .trim();

    if (!query) {
      await this.sendResponse({
        content: '무엇을 도와드릴까요? 궁금한 점이나 요청을 말씀해주세요!',
        channelId: msg.channelId,
        replyToMessageId: msg.id,
      });
      return;
    }

    // 최근 대화 컨텍스트 (버퍼에서 가져오기)
    const recentMessages = this.buffer.getMessages(msg.channelId);
    const context = recentMessages
      .filter((m) => m.id !== msg.id) // 현재 메시지 제외
      .slice(-15) // 최근 15개
      .map((m) => `${m.authorName}: ${m.content}`)
      .join('\n');

    try {
      const result = await chatModel.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: `질문: ${query}${context ? `\n\n최근 대화:\n${context}` : ''}` }],
          },
        ],
        systemInstruction: MENTION_SYSTEM_PROMPT,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      });

      const reply = result.response.text();
      if (reply) {
        await this.sendResponse({
          content: reply,
          channelId: msg.channelId,
          replyToMessageId: msg.id,
        });
      }
    } catch (err) {
      console.error('[BotEngine] 멘션 응답 실패:', err);
      await this.sendResponse({
        content: '죄송합니다, 잠시 후 다시 시도해주세요.',
        channelId: msg.channelId,
        replyToMessageId: msg.id,
      });
    }
  }

  /**
   * 마무리 요약을 90초 후에 실행하도록 예약
   * 종결 신호 감지 후 추가 대화가 이어지면 타이머 리셋
   */
  private scheduleSummary(channelId: string): void {
    // 기존 타이머 취소
    const existing = this.summaryTimers.get(channelId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this.triggerSummary(channelId);
      this.summaryTimers.delete(channelId);
    }, this.config.summaryDelayMs);

    this.summaryTimers.set(channelId, timer);
  }

  /**
   * 마무리 요약 즉시 실행
   */
  private async triggerSummary(channelId: string): Promise<void> {
    // 타이머 정리
    const timer = this.summaryTimers.get(channelId);
    if (timer) {
      clearTimeout(timer);
      this.summaryTimers.delete(channelId);
    }

    const pending = this.pendingPatterns.get(channelId) ?? [];

    // 축적된 패턴이 없으면 현재 버퍼로 분석
    if (pending.length === 0) {
      const messages = this.buffer.getMessages(channelId);
      if (messages.length < 3) {
        await this.sendResponse({
          content: '📝 정리할 내용이 충분하지 않습니다.',
          channelId,
        });
        return;
      }
      const detections = await detectPatterns(messages);
      const summaryDetections = detections.filter((d) =>
        SUMMARY_PATTERNS.includes(d.type)
      );
      if (summaryDetections.length === 0) {
        await this.sendResponse({
          content: '📝 정리할 내용이 충분하지 않습니다.',
          channelId,
        });
        return;
      }
      pending.push(...summaryDetections);
    }

    const summary = aggregateToSummary(pending);

    // 할 일, 결정, 자료, 회고 중 하나라도 있어야 요약
    const hasContent =
      summary.tasks.length > 0 ||
      summary.decisions.length > 0 ||
      summary.resources.length > 0 ||
      summary.retrospectives.length > 0;

    if (!hasContent) {
      await this.sendResponse({
        content: '📝 정리할 내용이 충분하지 않습니다.',
        channelId,
      });
    } else {
      const response = buildSummaryResponse(summary, channelId);
      const sentMsg = await this.sendResponse(response);

      // DB 기록: 마무리 요약 → bot_interventions + team_*
      const guildId = pending[0]?.sourceMessages?.[0]?.guildId;
      if (guildId) {
        const summaryDetection: PatternDetection = {
          type: 'conversation-end',
          confidence: 1.0,
          data: { type: 'conversation-end', signal: 'summary' },
          sourceMessages: pending.flatMap((p) => p.sourceMessages),
        };
        const interventionId = await saveIntervention(
          summaryDetection, sentMsg?.id, 'auto_summary'
        ).catch(() => null);

        saveSummaryData(summary, channelId, guildId, interventionId).catch((e) =>
          console.error('[BotEngine] summary 데이터 저장 실패:', e)
        );
      }
    }

    // 정리
    this.pendingPatterns.delete(channelId);
    this.buffer.clear(channelId);
  }

  /**
   * 마무리 요약용 패턴 축적
   */
  private accumulatePatterns(
    channelId: string,
    detections: PatternDetection[]
  ): void {
    const existing = this.pendingPatterns.get(channelId) ?? [];
    existing.push(...detections);
    this.pendingPatterns.set(channelId, existing);
  }

  /**
   * 봇 응답 전송 (메시지 + 리액션)
   */
  private async sendResponse(response: BotResponse): Promise<{ id: string } | null> {
    try {
      const sentMessage = await sendChannelMessage(
        response.channelId,
        response.content,
        response.replyToMessageId,
        response.components
      );

      // 리액션 달기
      if (response.reactions && sentMessage?.id) {
        for (const emoji of response.reactions) {
          await addReaction(response.channelId, sentMessage.id, emoji);
        }
      }

      return sentMessage ?? null;
    } catch (err) {
      console.error('[BotEngine] 응답 전송 실패:', err);
      return null;
    }
  }

  /**
   * ❌ dismiss 이벤트 처리 (MESSAGE_REACTION_ADD에서 호출)
   */
  onDismiss(channelId: string, patternType: PatternDetection['type']): void {
    this.cooldown.recordDismiss(channelId, patternType);
  }

  /**
   * ✅ 수락 이벤트 처리
   */
  onAccept(channelId: string, patternType: PatternDetection['type']): void {
    this.cooldown.recordAccept(channelId, patternType);
  }

  /**
   * 정기 정리 (5분마다 호출 권장)
   */
  cleanup(): void {
    this.buffer.cleanup();
  }
}
