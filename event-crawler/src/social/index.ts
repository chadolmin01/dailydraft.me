/**
 * SNS Crawlers Index (2차 구현)
 *
 * 현재 상태: Placeholder 구현
 * - Instagram, Facebook, Twitter 크롤러 구조만 정의
 * - 실제 크롤링 로직은 API 키 및 추가 설정 후 구현 예정
 */

export { InstagramCrawler, parseInstagramCaption } from './instagram.js';
export { FacebookCrawler, buildGraphApiUrl, transformFacebookEvent } from './facebook.js';
export { TwitterCrawler, parseTweetForEvent } from './twitter.js';

import { EventSource } from '../types/index.js';

// SNS sources are 2nd phase
export const SNS_SOURCES: EventSource[] = ['instagram', 'facebook', 'twitter'];

/**
 * Check if SNS crawlers are available
 */
export function checkSnsAvailability(): Record<EventSource, { available: boolean; reason?: string }> {
  return {
    instagram: {
      available: false,
      reason: 'Instagram Graph API credentials required',
    },
    facebook: {
      available: false,
      reason: 'Facebook App ID and secret required',
    },
    twitter: {
      available: !!process.env.TWITTER_BEARER_TOKEN,
      reason: process.env.TWITTER_BEARER_TOKEN
        ? undefined
        : 'TWITTER_BEARER_TOKEN required',
    },
    // Web crawlers (not SNS but included for completeness)
    contestkorea: { available: true },
    linkareer: { available: true },
    onoffmix: { available: true },
    devpost: { available: true },
  };
}
