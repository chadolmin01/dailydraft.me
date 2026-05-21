/**
 * AI 기반 대화 패턴 감지
 *
 * 2단계 파이프라인:
 * 1. 룰 기반 pre-filter (저비용) → 후보 패턴 + 대략적 confidence
 * 2. Gemini Flash-Lite 분류 (AI) → 확정 + 구조화된 데이터 추출
 *
 * pre-filter를 거치지 않는 메시지는 AI에 보내지 않음 → 비용 절약
 */

import { chatModel } from '../../ai/gemini-client';
import type {
  BufferedMessage,
  PatternDetection,
  PatternType,
  PatternData,
} from './types';

// ── 1단계: 룰 기반 Pre-filter ──

interface PrefilterResult {
  type: PatternType;
  confidence: number;
}

const DECISION_KEYWORDS =
  /뭘로|어떡|어떻게\s*할|어느\s*게|1안|2안|A안|B안|vs|ㅋㅋ.*둘다|고민|결정.*못|안\s*정한/;
const TASK_KEYWORDS =
  /할게|해놓을게|해줘|해주면|맡을게|담당|이번\s*주\s*까지|내일\s*까지|ㅇㅋ/;
const SCHEDULE_KEYWORDS =
  /모이자|만나자|만날|볼까|보자|가능|안\s*돼|수업|알바|몇\s*시|몇\s*요일|언제.*할|언제.*볼|언제.*만|시간\s*되|시간\s*맞|일정.*잡|약속.*잡|미팅|회의.*언제|월요일|화요일|수요일|목요일|금요일|토요일|일요일/;
const BLOCKER_KEYWORDS =
  /삽질|안\s*됨|안\s*돼|에러|왜\s*이런|계속|시간째|모르겠|막힘|해결.*안/;
const SCOPE_KEYWORDS =
  /도\s*넣으면|도\s*하면|도\s*해야|추가.*하면|기능.*더/;
const RETRO_KEYWORDS =
  /다음에는|이번에.*힘|빡셌|아쉬|잘\s*했|개선|반성|뭐가.*문제/;
const END_KEYWORDS =
  /수고|ㄱㅅ|고생|바이|다음에\s*봐|여기까지|끝|이만|잘\s*자|ㅂㅂ|빠이|그럼.*각자|이렇게\s*하자|정리.*됐/;
const HANDOFF_KEYWORDS =
  /다\s*했어|완성|끝났|완료|확인.*해줘|봐줘|작업\s*시작/;
const UNOWNED_KEYWORDS = /누가\s*하|누가\s*할|담당자|맡을\s*사람/;
// 일정 확정: (요일/시간) + (확정 표현) 이 한 메시지에 같이 올 때
const SCHEDULE_DAY_TIME = /월요일|화요일|수요일|목요일|금요일|토요일|일요일|내일|모레|다음\s*주|이번\s*주|\d{1,2}시|\d{1,2}:\d{2}|\d{1,2}월\s*\d{1,2}일/;
// 확정 표현만 (질문/제안 제외: "어때?", "할까?" 등은 schedule-coordination)
const SCHEDULE_CONFIRM = /하자|하겠|할게|합시다|합의|ㅇㅋ|오케이|오키|좋아|그걸로|그때\s*보자|그때\s*봐|확정|결정|정하자|그렇게|ㄱㄱ|고고|으로\s*하자|에\s*보자|에\s*만나|으로\s*정|ㅇㅇ|넵|그래/;
const URL_REGEX = /https?:\/\/[^\s<>)"]+/;

export function prefilter(
  messages: BufferedMessage[]
): PrefilterResult[] {
  if (messages.length === 0) return [];

  const combined = messages.map((m) => m.content).join(' ');
  const results: PrefilterResult[] = [];

  // 대화 종결 감지 — 마지막 메시지만 확인
  const lastMsg = messages[messages.length - 1].content;
  if (END_KEYWORDS.test(lastMsg)) {
    results.push({ type: 'conversation-end', confidence: 0.7 });
  }

  // URL 공유
  if (messages.some((m) => m.urls.length > 0)) {
    results.push({ type: 'resource-shared', confidence: 0.8 });
  }

  // 결정 교착: 3개+ 메시지에 옵션 비교 패턴
  if (messages.length >= 3 && DECISION_KEYWORDS.test(combined)) {
    results.push({ type: 'decision-deadlock', confidence: 0.6 });
  }

  // 할 일 배정
  if (TASK_KEYWORDS.test(combined)) {
    results.push({ type: 'task-assignment', confidence: 0.65 });
  }

  // 일정 확정: 마지막 메시지에 (요일/시간) + (확정 표현) 둘 다 있을 때
  // schedule-coordination보다 우선 — 확정이면 조율 제안 불필요
  if (SCHEDULE_DAY_TIME.test(lastMsg) && SCHEDULE_CONFIRM.test(lastMsg)) {
    results.push({ type: 'schedule-confirmed', confidence: 0.8 });
  }
  // 일정 조율: 키워드 매칭 시 즉시 감지 (빠른 제안용)
  else if (SCHEDULE_KEYWORDS.test(combined)) {
    results.push({ type: 'schedule-coordination', confidence: 0.7 });
  }

  // 블로커: 같은 사람이 2개+ 메시지로 어려움 호소
  const authorCounts = new Map<string, number>();
  messages.forEach((m) => {
    if (BLOCKER_KEYWORDS.test(m.content)) {
      authorCounts.set(m.authorName, (authorCounts.get(m.authorName) ?? 0) + 1);
    }
  });
  for (const [, count] of authorCounts) {
    if (count >= 2) {
      results.push({ type: 'blocker-frustration', confidence: 0.5 });
      break;
    }
  }

  // 스코프 크립
  if (SCOPE_KEYWORDS.test(combined)) {
    results.push({ type: 'scope-creep', confidence: 0.4 });
  }

  // 회고
  if (RETRO_KEYWORDS.test(combined) && messages.length >= 3) {
    results.push({ type: 'retrospective', confidence: 0.5 });
  }

  // 핸드오프
  if (HANDOFF_KEYWORDS.test(combined)) {
    results.push({ type: 'handoff-pending', confidence: 0.5 });
  }

  // 담당자 미정
  if (UNOWNED_KEYWORDS.test(combined)) {
    results.push({ type: 'unowned-task', confidence: 0.7 });
  }

  return results;
}

// ── 2단계: AI 분류 + 데이터 추출 ──

const SYSTEM_PROMPT = `당신은 대학교 프로젝트 동아리의 Discord 대화를 분석하는 AI입니다.
대화에서 아래 패턴 중 가장 적합한 것을 감지하고, 구조화된 데이터를 추출하세요.

## 감지 가능한 패턴

1. decision-deadlock: 팀이 A vs B 선택에서 합의에 실패
2. task-assignment: "~할게", "~해줘" 등으로 할 일이 배정됨
3. schedule-coordination: 모임 시간을 맞추려는 대화
4. resource-shared: 중요한 링크/파일이 공유됨
5. blocker-frustration: 한 명이 기술적 문제로 막혀있음
6. scope-creep: 새 기능을 추가하자는 제안이 나옴
7. handoff-pending: 작업 완료 후 다음 사람에게 넘기는 중
8. retrospective: 지나간 작업에 대한 반성/개선 논의
9. unowned-task: 할 일은 있는데 담당자가 없음
10. unanswered-question: 질문이 답변 없이 묻힘
11. conversation-end: 대화가 마무리되는 신호

## 규칙
- confidence 0.0~1.0로 확신도를 표시하세요
- 잡담, 밈, 감정 표현만 있는 대화는 null을 반환하세요
- 여러 패턴이 감지되면 모두 반환하세요
- 대학생의 자연스러운 한국어(반말, 줄임말, 이모지)를 이해하세요

## 응답 형식 (JSON만 반환)
{
  "patterns": [
    {
      "type": "패턴타입",
      "confidence": 0.85,
      "data": { ... 패턴별 데이터 ... }
    }
  ]
}

## 패턴별 data 형식
- decision-deadlock: { "type": "decision-deadlock", "topic": "주제", "options": ["A", "B"], "participants": ["이름들"] }
- task-assignment: { "type": "task-assignment", "tasks": [{ "assignee": "이름", "task": "내용", "deadline": "기한 or null" }] }
- schedule-coordination: { "type": "schedule-coordination", "purpose": "목적", "candidates": ["수요일 저녁"], "participants": ["이름들"], "isComplex": false }
- resource-shared: { "type": "resource-shared", "resources": [{ "url": "URL", "label": "설명", "sharedBy": "이름" }] }
- blocker-frustration: { "type": "blocker-frustration", "who": "이름", "issue": "문제", "duration": "시간 or null" }
- scope-creep: { "type": "scope-creep", "suggestions": ["기능1", "기능2"] }
- handoff-pending: { "type": "handoff-pending", "from": "이름", "to": "이름", "artifact": "산출물" }
- retrospective: { "type": "retrospective", "topic": "주제", "learnings": ["교훈1", "교훈2"] }
- unowned-task: { "type": "unowned-task", "task": "할 일", "deadline": "기한 or null" }
- unanswered-question: { "type": "unanswered-question", "questioner": "이름", "questions": ["질문1"] }
- conversation-end: { "type": "conversation-end", "signal": "감지된 종결 표현" }`;

/**
 * AI로 대화 패턴 분류 + 데이터 추출
 * pre-filter에서 후보가 나온 경우에만 호출
 */
export async function classifyWithAI(
  messages: BufferedMessage[],
  candidateTypes: PatternType[]
): Promise<PatternDetection[]> {
  const conversation = messages
    .map(
      (m) =>
        `[${m.timestamp.toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul' })}] ${m.authorName}: ${m.content}`
    )
    .join('\n');

  const prompt = `다음 Discord 대화를 분석하세요.
후보 패턴: ${candidateTypes.join(', ')}

대화:
${conversation}`;

  try {
    const result = await chatModel.generateContent({
      contents: [
        { role: 'user', parts: [{ text: prompt }] },
      ],
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    const text = result.response.text();

    const parsed = JSON.parse(text);
    if (!parsed.patterns || !Array.isArray(parsed.patterns)) return [];

    return parsed.patterns
      .filter((p: any) => p.confidence >= 0.5)
      .map((p: any) => ({
        type: p.type as PatternType,
        confidence: p.confidence,
        // AI가 data.type을 누락할 수 있으므로 pattern.type에서 보충
        data: { ...p.data, type: p.type } as PatternData,
        sourceMessages: messages,
      }));
  } catch (err) {
    console.error('[PatternDetector] AI 분류 실패:', err);
    return [];
  }
}

/**
 * 전체 파이프라인: pre-filter → AI 분류
 * 메시지 배열을 받아 감지된 패턴 목록 반환
 *
 * @param ruleOnlyTypes — AI 분류를 건너뛸 패턴 타입 (prefilter 결과만으로 반환).
 *   2026-04-18: blocker-frustration 등 단순 넛지용 패턴은 AI 분류 비용 낭비라서
 *   룰 기반 confidence만으로 충분하다는 연구 결론에 따라 도입.
 */
export async function detectPatterns(
  messages: BufferedMessage[],
  ruleOnlyTypes: PatternType[] = []
): Promise<PatternDetection[]> {
  if (messages.length < 2) return [];

  // 1단계: 룰 기반 pre-filter
  const candidates = prefilter(messages);
  if (candidates.length === 0) return [];

  // pre-filter confidence 0.5 이상만 유지
  const worthChecking = candidates.filter((c) => c.confidence >= 0.5);
  if (worthChecking.length === 0) return [];

  // ruleOnly: AI 생략, prefilter 결과를 그대로 PatternDetection으로 변환
  const ruleOnlySet = new Set(ruleOnlyTypes);
  const ruleOnlyDetections: PatternDetection[] = worthChecking
    .filter((c) => ruleOnlySet.has(c.type))
    .map((c) => ({
      type: c.type,
      confidence: c.confidence,
      // AI 없이는 구조화된 데이터 추출 불가 → 최소 payload
      data: { type: c.type } as PatternData,
      sourceMessages: messages,
    }));

  // 나머지만 AI 분류
  const aiTypes = worthChecking
    .filter((c) => !ruleOnlySet.has(c.type))
    .map((c) => c.type);

  const aiDetections =
    aiTypes.length > 0 ? await classifyWithAI(messages, aiTypes) : [];

  return [...ruleOnlyDetections, ...aiDetections];
}
