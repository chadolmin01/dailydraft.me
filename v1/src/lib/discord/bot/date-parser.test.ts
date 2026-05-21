/**
 * date-parser 스모크 테스트
 *
 * 목적: 한국어 관용구의 chrono-node 커버리지를 측정하고, 70% 미만일 때 Gemini
 * fallback 유지 판단의 근거로 사용.
 */

import { describe, it, expect } from 'vitest';
import { parseKoreanDate } from './date-parser';

// 고정 기준일: 2026-04-20 (월) 오전 10:00 KST
const REF = new Date('2026-04-20T01:00:00.000Z'); // UTC 01:00 = KST 10:00

describe('parseKoreanDate', () => {
  it('내일 오후 3시', () => {
    const d = parseKoreanDate('내일 오후 3시', REF);
    expect(d).not.toBeNull();
    expect(d!.getDate()).toBe(21);
  });

  it('모레 저녁', () => {
    const d = parseKoreanDate('모레 저녁', REF);
    expect(d).not.toBeNull();
    expect(d!.getDate()).toBe(22);
  });

  it('금요일 7시', () => {
    const d = parseKoreanDate('금요일 7시', REF);
    expect(d).not.toBeNull();
    expect(d!.getDay()).toBe(5); // 금요일
  });

  it('다음 주 월요일', () => {
    const d = parseKoreanDate('다음 주 월요일', REF);
    expect(d).not.toBeNull();
    expect(d!.getDay()).toBe(1); // 월요일
    // 기준 월요일이 20일이므로 다음 주 월요일은 27일 이후
    expect(d!.getDate()).toBeGreaterThanOrEqual(27);
  });

  it('4월 25일', () => {
    const d = parseKoreanDate('4월 25일', REF);
    expect(d).not.toBeNull();
    expect(d!.getMonth()).toBe(3); // 0-indexed
    expect(d!.getDate()).toBe(25);
  });

  it('4/25 오후 7시', () => {
    const d = parseKoreanDate('4/25 오후 7시', REF);
    expect(d).not.toBeNull();
    expect(d!.getMonth()).toBe(3);
    expect(d!.getDate()).toBe(25);
  });

  it('오늘 19:00', () => {
    const d = parseKoreanDate('오늘 19:00', REF);
    expect(d).not.toBeNull();
    expect(d!.getDate()).toBe(20);
  });

  it('이번 주 금요일', () => {
    const d = parseKoreanDate('이번 주 금요일', REF);
    expect(d).not.toBeNull();
    expect(d!.getDay()).toBe(5);
  });

  it('빈 문자열은 null', () => {
    expect(parseKoreanDate('', REF)).toBeNull();
  });

  it('해석 불가능한 문자열은 null', () => {
    const d = parseKoreanDate('가나다라', REF);
    expect(d).toBeNull();
  });
});
