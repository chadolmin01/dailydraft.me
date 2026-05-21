/**
 * 한국어 날짜 파서 (정규식 기반)
 *
 * AI 호출 제거 목적:
 *   기존 interactions/route.ts:688 의 Gemini 날짜 파싱을 룰 기반으로 대체해
 *   호출 비용·지연(3초→1ms)·장애 의존도를 줄입니다.
 *
 * 구현 경위:
 *   chrono-node는 한국어 로케일을 지원하지 않음이 확인되어(검증 시점 2026-04-18)
 *   자체 한국어 정규식 파서로 전환.
 *
 * 지원 표현:
 *   - 오늘 / 내일 / 모레
 *   - X요일 (월요일 ~ 일요일, 풀네임만 허용)
 *   - 이번 주 X요일 / 다음 주 X요일
 *   - 오후 / 오전 HH시 MM분, HH:MM, HH시
 *   - M월 D일, M/D, M.D
 *
 * 모든 결과는 로컬 시간 기준으로 계산되며, KST 환경(Vercel ICN 리전)에서
 * 실행됨을 전제합니다.
 */

const DAY_OF_WEEK_FULL: Record<string, number> = {
  일요일: 0,
  월요일: 1,
  화요일: 2,
  수요일: 3,
  목요일: 4,
  금요일: 5,
  토요일: 6,
};

/** "오후 3시", "15:00", "3시 30분" → {hour, minute} */
function extractTime(text: string): { hour: number; minute: number } | null {
  const pmMatch = text.match(/오후\s*(\d{1,2})\s*(?:시)?\s*(?::|\s)?\s*(\d{1,2})?\s*분?/);
  if (pmMatch) {
    let hour = parseInt(pmMatch[1], 10);
    if (hour < 12) hour += 12;
    const minute = pmMatch[2] ? parseInt(pmMatch[2], 10) : 0;
    return { hour, minute };
  }
  const amMatch = text.match(/오전\s*(\d{1,2})\s*(?:시)?\s*(?::|\s)?\s*(\d{1,2})?\s*분?/);
  if (amMatch) {
    const hour = parseInt(amMatch[1], 10) % 12;
    const minute = amMatch[2] ? parseInt(amMatch[2], 10) : 0;
    return { hour, minute };
  }
  // "19:00", "19시", "19시 30분"
  // 주의: "3시" 앞에 오전/오후가 안 붙은 경우를 위해 단독 형태도 허용
  const timeMatch = text.match(/(\d{1,2})\s*(?::|시)\s*(\d{1,2})?\s*분?/);
  if (timeMatch) {
    const hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    if (hour >= 0 && hour <= 23) return { hour, minute };
  }
  return null;
}

/**
 * 메인 파서 — 한국어 관용구를 검사해 Date 반환.
 * 매칭 우선순위: 절대날짜(M월D일) → 상대일(내일/모레/오늘) → 요일(X요일)
 *
 * 이유 주석:
 *   "일", "월" 같은 한 글자 약어는 "내일"·"매일"·"4월" 등과 충돌하므로
 *   X요일 풀네임만 허용합니다. 사용자가 "금요일"을 적지 않으면 매칭 실패 → null.
 */
export function parseKoreanDate(text: string, refDate?: Date): Date | null {
  if (!text || text.trim().length === 0) return null;
  const ref = refDate ?? new Date();
  const time = extractTime(text); // 없으면 null → 기본 19:00 적용

  const applyTime = (d: Date) => {
    const t = time ?? { hour: 19, minute: 0 };
    d.setHours(t.hour, t.minute, 0, 0);
    return d;
  };

  // 1. 절대날짜: "M월 D일"
  const mdMatch = text.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  if (mdMatch) {
    const target = new Date(ref);
    const month = parseInt(mdMatch[1], 10) - 1;
    const day = parseInt(mdMatch[2], 10);
    target.setMonth(month, day);
    applyTime(target);
    if (target.getTime() < ref.getTime()) {
      target.setFullYear(target.getFullYear() + 1);
    }
    return target;
  }

  // 2. 절대날짜: "M/D" 또는 "M.D" (단, 연도 포함 형태 "YYYY-MM-DD"는 별도)
  const isoMatch = text.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const target = new Date(
      parseInt(isoMatch[1], 10),
      parseInt(isoMatch[2], 10) - 1,
      parseInt(isoMatch[3], 10),
    );
    applyTime(target);
    return target;
  }

  const mdSlash = text.match(/(?<!\d)(\d{1,2})[./](\d{1,2})(?![./\d])/);
  if (mdSlash) {
    const target = new Date(ref);
    const month = parseInt(mdSlash[1], 10) - 1;
    const day = parseInt(mdSlash[2], 10);
    if (month >= 0 && month < 12 && day >= 1 && day <= 31) {
      target.setMonth(month, day);
      applyTime(target);
      if (target.getTime() < ref.getTime()) {
        target.setFullYear(target.getFullYear() + 1);
      }
      return target;
    }
  }

  // 3. 상대일
  if (/내일/.test(text)) {
    const target = new Date(ref);
    target.setDate(target.getDate() + 1);
    return applyTime(target);
  }
  if (/모레/.test(text)) {
    const target = new Date(ref);
    target.setDate(target.getDate() + 2);
    return applyTime(target);
  }
  if (/오늘/.test(text)) {
    const target = new Date(ref);
    return applyTime(target);
  }

  // 4. 요일 — 풀네임만 허용
  for (const [key, dow] of Object.entries(DAY_OF_WEEK_FULL)) {
    if (text.includes(key)) {
      const target = new Date(ref);
      const currentDow = target.getDay();
      let diff = dow - currentDow;
      if (/다음\s*주/.test(text)) {
        // 다음 주 X요일: 오늘 기준 같은 요일이면 +7, 지난 요일이면 다음 주까지 끌고 감
        if (diff < 0) diff += 7;
        diff += 7;
      } else {
        // 이번 주 X요일 / 단순 X요일: forward-date (오늘이 X요일이면 오늘, 지났으면 다음 주)
        if (diff < 0) diff += 7;
        // 오늘이 같은 요일이면 diff=0 → 오늘 그대로
      }
      target.setDate(target.getDate() + diff);
      return applyTime(target);
    }
  }

  return null;
}
