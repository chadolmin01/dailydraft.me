/**
 * 쿨다운 + dismiss 추적
 * - 같은 채널에서 같은 패턴 30분 내 재발동 방지
 * - 연속 3회 dismiss 시 1주일 억제
 */

import type { PatternType, BotConfig } from './types';
import { DEFAULT_BOT_CONFIG } from './types';

interface CooldownEntry {
  lastTriggered: number;
  consecutiveDismisses: number;
  suppressedUntil: number; // 0이면 억제 안 함
}

const SUPPRESS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 1주일

export class CooldownGuard {
  // "channelId:patternType" → CooldownEntry
  private entries = new Map<string, CooldownEntry>();
  private config: BotConfig;

  constructor(config: Partial<BotConfig> = {}) {
    this.config = { ...DEFAULT_BOT_CONFIG, ...config };
  }

  private key(channelId: string, pattern: PatternType): string {
    return `${channelId}:${pattern}`;
  }

  /**
   * 이 패턴을 발동해도 되는지 확인.
   * false면 쿨다운 중이거나 억제 상태.
   */
  canTrigger(channelId: string, pattern: PatternType): boolean {
    const entry = this.entries.get(this.key(channelId, pattern));
    if (!entry) return true;

    const now = Date.now();

    // 1주일 억제 중
    if (entry.suppressedUntil > now) return false;

    // 쿨다운 중
    if (now - entry.lastTriggered < this.config.cooldownMs) return false;

    return true;
  }

  /**
   * 패턴 발동 기록
   */
  recordTrigger(channelId: string, pattern: PatternType): void {
    const k = this.key(channelId, pattern);
    const entry = this.entries.get(k) ?? {
      lastTriggered: 0,
      consecutiveDismisses: 0,
      suppressedUntil: 0,
    };
    entry.lastTriggered = Date.now();
    // 발동 시 dismiss 카운트 리셋하지 않음 (연속 dismiss만 추적)
    this.entries.set(k, entry);
  }

  /**
   * ❌ dismiss 기록. 연속 3회 이상이면 1주일 억제.
   */
  recordDismiss(channelId: string, pattern: PatternType): void {
    const k = this.key(channelId, pattern);
    const entry = this.entries.get(k) ?? {
      lastTriggered: 0,
      consecutiveDismisses: 0,
      suppressedUntil: 0,
    };
    entry.consecutiveDismisses++;

    if (entry.consecutiveDismisses >= this.config.dismissThreshold) {
      entry.suppressedUntil = Date.now() + SUPPRESS_DURATION_MS;
    }
    this.entries.set(k, entry);
  }

  /**
   * ✅ 수락 기록. dismiss 카운트 리셋.
   */
  recordAccept(channelId: string, pattern: PatternType): void {
    const k = this.key(channelId, pattern);
    const entry = this.entries.get(k);
    if (entry) {
      entry.consecutiveDismisses = 0;
    }
  }

  /**
   * 야간 시간인지 확인 (KST 기준)
   */
  isQuietHour(): boolean {
    const kstHour = new Date().getUTCHours() + 9;
    const hour = kstHour >= 24 ? kstHour - 24 : kstHour;
    return (
      hour >= this.config.quietHourStart || hour < this.config.quietHourEnd
    );
  }
}
