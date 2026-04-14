/**
 * Discord 실시간 봇 타입 정의
 * 3계층 구조: 슬래시 커맨드 / 즉시 감지 / 마무리 요약
 */

import type { DiscordMessage } from '../client';

// ── 패턴 감지 ──

export type PatternType =
  | 'decision-deadlock'    // 결정 교착 → 투표 제안
  | 'task-assignment'      // 할 일 언급 → 체크리스트
  | 'schedule-coordination'// 일정 조율 → 투표 or When2Meet
  | 'schedule-confirmed'   // 일정 확정 → Discord Event 생성
  | 'resource-shared'      // 링크 공유 → 자료 정리
  | 'blocker-frustration'  // 막힘 감지 → 도움 요청
  | 'scope-creep'          // 범위 확장 → 백로그 제안
  | 'handoff-pending'      // 핸드오프 → 확인 요청
  | 'retrospective'        // 자연 회고 → 기록 제안
  | 'unowned-task'         // 담당자 미정 → 배정 요청
  | 'unanswered-question'  // 질문 묻힘 → 리마인드
  | 'conversation-end';    // 대화 종결 → 마무리 요약

// 즉시 반응해야 하는 패턴 (대화 흐름 중 개입)
export const INSTANT_PATTERNS: PatternType[] = [
  'decision-deadlock',
  'schedule-coordination',
  'schedule-confirmed',
  'blocker-frustration',
  'unanswered-question',
];

// 마무리 요약에 묶이는 패턴 (종결 신호 시 한번에)
export const SUMMARY_PATTERNS: PatternType[] = [
  'task-assignment',
  'resource-shared',
  'scope-creep',
  'handoff-pending',
  'retrospective',
  'unowned-task',
];

export interface PatternDetection {
  type: PatternType;
  confidence: number;       // 0.0 ~ 1.0
  data: PatternData;
  sourceMessages: BufferedMessage[];
}

// 각 패턴별 추출 데이터
export type PatternData =
  | DecisionData
  | TaskData
  | ScheduleData
  | ResourceData
  | BlockerData
  | ScopeData
  | HandoffData
  | RetroData
  | UnownedTaskData
  | UnansweredData
  | ConversationEndData;

export interface DecisionData {
  type: 'decision-deadlock';
  topic: string;
  options: string[];
  participants: string[];
}

export interface TaskData {
  type: 'task-assignment';
  tasks: Array<{
    assignee: string;
    task: string;
    deadline?: string;
  }>;
}

export interface ScheduleData {
  type: 'schedule-coordination';
  purpose?: string;
  candidates: string[];          // "수요일 저녁" 등
  participants: string[];
  isComplex: boolean;            // true면 When2Meet 추천
}

export interface ResourceData {
  type: 'resource-shared';
  resources: Array<{
    url: string;
    label: string;
    sharedBy: string;
  }>;
}

export interface BlockerData {
  type: 'blocker-frustration';
  who: string;
  issue: string;
  duration?: string;
}

export interface ScopeData {
  type: 'scope-creep';
  suggestions: string[];
}

export interface HandoffData {
  type: 'handoff-pending';
  from: string;
  to: string;
  artifact: string;
}

export interface RetroData {
  type: 'retrospective';
  topic: string;
  learnings: string[];
}

export interface UnownedTaskData {
  type: 'unowned-task';
  task: string;
  deadline?: string;
}

export interface UnansweredData {
  type: 'unanswered-question';
  questioner: string;
  questions: string[];
}

export interface ConversationEndData {
  type: 'conversation-end';
  signal: string;  // 감지된 종결 표현
}

// ── 메시지 버퍼 ──

export interface BufferedMessage {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  isBot: boolean;
  timestamp: Date;
  urls: string[];
  channelId: string;
  guildId: string;
  /** Discord 첨부파일 메타데이터 (FileTrail용) */
  attachments: Array<{
    id: string;
    filename: string;
    contentType: string;
    size: number;
  }>;
}

// ── FileTrail ──

/** 파일 업로드 후 스레드에서 유저 답변 대기 중인 세션 */
export interface FileTrailSession {
  threadId: string;
  channelId: string;        // 원래 채널 (스레드의 부모)
  guildId: string;
  messageId: string;        // 원본 파일 업로드 메시지 ID (중복 감지용)
  fileLogIds: string[];     // DB file_logs ID 목록
  filenames: string[];
  uploaderId: string;
  parentCandidate?: {       // 유사 파일 발견 시
    id: string;
    filename: string;
  };
  createdAt: number;
}

// ── 쿨다운 ──

export interface CooldownKey {
  channelId: string;
  patternType: PatternType;
}

// ── 봇 응답 ──

export interface BotResponse {
  content: string;
  channelId: string;
  replyToMessageId?: string;   // 특정 메시지에 답장
  reactions?: string[];         // 자동으로 달 이모지
  components?: unknown[];       // Discord 버튼 등 메시지 컴포넌트
}

// ── 마무리 요약 ──

export interface MeetingSummary {
  tasks: TaskData['tasks'];
  decisions: Array<{ topic: string; result: string }>;
  resources: ResourceData['resources'];
  retrospectives: RetroData['learnings'];
  nextMeeting?: string;
}

// ── 슬래시 커맨드 ──

export type SlashCommand =
  | '마무리'
  | '투표'
  | '일정';

// ── 설정 ──

export interface BotConfig {
  /** AI 감지 최소 confidence (기본 0.7) */
  minConfidence: number;
  /** 같은 패턴 재감지 쿨다운 (ms, 기본 30분) */
  cooldownMs: number;
  /** 대화 종결 감지 후 요약까지 대기 시간 (ms, 기본 90초) */
  summaryDelayMs: number;
  /** 질문 미답변 감지 대기 시간 (ms, 기본 30분) */
  unansweredDelayMs: number;
  /** 야간 모드 시작 시간 (KST, 기본 23) */
  quietHourStart: number;
  /** 야간 모드 끝 시간 (KST, 기본 7) */
  quietHourEnd: number;
  /** dismiss 연속 횟수 → 패턴 억제 (기본 3) */
  dismissThreshold: number;
}

export const DEFAULT_BOT_CONFIG: BotConfig = {
  minConfidence: 0.7,
  cooldownMs: 2 * 60 * 60 * 1000,   // 2시간
  summaryDelayMs: 90 * 1000,        // 90초
  unansweredDelayMs: 30 * 60 * 1000,// 30분
  quietHourStart: 23,
  quietHourEnd: 7,
  dismissThreshold: 3,
};
