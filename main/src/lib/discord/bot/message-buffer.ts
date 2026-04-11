/**
 * 채널별 메시지 버퍼
 * - 채널당 최근 20개 메시지를 10분 윈도우로 보관
 * - URL 자동 추출, 봇 메시지 필터링
 */

import type { BufferedMessage } from './types';

const URL_REGEX = /https?:\/\/[^\s<>)"]+/g;
const BUFFER_SIZE = 20;
const BUFFER_WINDOW_MS = 10 * 60 * 1000; // 10분

export class MessageBuffer {
  // channelId → 메시지 배열 (최신이 뒤)
  private buffers = new Map<string, BufferedMessage[]>();

  /**
   * 메시지 추가. Discord Gateway MESSAGE_CREATE 이벤트에서 호출.
   * 봇 메시지는 저장하지 않음 (봇끼리 반응 루프 방지)
   */
  push(raw: {
    id: string;
    content: string;
    author: { id: string; username: string; bot?: boolean };
    timestamp: string;
    channel_id: string;
    guild_id: string;
  }): BufferedMessage | null {
    if (raw.author.bot) return null;

    const msg: BufferedMessage = {
      id: raw.id,
      content: raw.content,
      authorId: raw.author.id,
      authorName: raw.author.username,
      isBot: false,
      timestamp: new Date(raw.timestamp),
      urls: raw.content.match(URL_REGEX) ?? [],
      channelId: raw.channel_id,
      guildId: raw.guild_id,
    };

    const buf = this.buffers.get(raw.channel_id) ?? [];
    buf.push(msg);

    // 오래된 메시지 정리: 버퍼 크기 초과 또는 10분 지난 메시지
    const cutoff = Date.now() - BUFFER_WINDOW_MS;
    const trimmed = buf
      .filter((m) => m.timestamp.getTime() > cutoff)
      .slice(-BUFFER_SIZE);

    this.buffers.set(raw.channel_id, trimmed);
    return msg;
  }

  /**
   * 채널의 현재 버퍼 반환 (복사본)
   */
  getMessages(channelId: string): BufferedMessage[] {
    return [...(this.buffers.get(channelId) ?? [])];
  }

  /**
   * 최근 N분 이내 메시지만 반환
   */
  getRecentMessages(channelId: string, windowMs: number): BufferedMessage[] {
    const cutoff = Date.now() - windowMs;
    return this.getMessages(channelId).filter(
      (m) => m.timestamp.getTime() > cutoff
    );
  }

  /**
   * 채널의 마지막 메시지 시간
   */
  getLastMessageTime(channelId: string): Date | null {
    const buf = this.buffers.get(channelId);
    if (!buf || buf.length === 0) return null;
    return buf[buf.length - 1].timestamp;
  }

  /**
   * 채널의 고유 참여자 수 (최근 윈도우 내)
   */
  getParticipantCount(channelId: string): number {
    const messages = this.getMessages(channelId);
    return new Set(messages.map((m) => m.authorId)).size;
  }

  /**
   * 버퍼 초기화 (마무리 요약 후)
   */
  clear(channelId: string): void {
    this.buffers.delete(channelId);
  }

  /**
   * 전체 버퍼 정리 (오래된 채널)
   */
  cleanup(): void {
    const cutoff = Date.now() - BUFFER_WINDOW_MS * 3; // 30분 이상 비활성
    for (const [channelId, buf] of this.buffers) {
      const lastMsg = buf[buf.length - 1];
      if (!lastMsg || lastMsg.timestamp.getTime() < cutoff) {
        this.buffers.delete(channelId);
      }
    }
  }
}
