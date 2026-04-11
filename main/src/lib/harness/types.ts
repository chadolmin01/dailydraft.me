/**
 * 멀티소스 하네스 시스템 타입 정의
 *
 * 동아리가 사용하는 모든 도구에서 데이터를 수집하여
 * Ghostwriter에 구조화된 컨텍스트를 제공한다.
 *
 * 원칙:
 * - 읽기 전용: 외부 도구에 절대 쓰지 않음
 * - 실패 격리: 한 소스 실패가 다른 소스/초안 생성을 막지 않음
 * - 최소 세팅: URL/토큰 붙여넣기만으로 연동
 */

// ── 커넥터 ──

/** 지원하는 외부 소스 타입 */
export type ConnectorType =
  | 'discord'           // 기존 (메시지, 핀, 체크인, 봇 감지)
  | 'google_sheets'     // 진행 상황 표, 예산, 출석
  | 'github'            // 커밋, PR, 이슈
  | 'notion'            // 페이지, 데이터베이스, 칸반
  | 'figma'             // 파일 활동, 코멘트
  | 'google_calendar'   // 이벤트, 참석
  | 'google_drive'      // 파일 변경 이력
  | 'linear'            // 이슈 트래커
  | 'slack';            // 메시지 (Discord 대안으로 쓰는 클럽)

/** 커넥터 설정 — club_harness_connectors 테이블에 저장 */
export interface ConnectorConfig {
  id: string;
  clubId: string;
  opportunityId?: string;  // 특정 프로젝트에만 연결 (null이면 클럽 전체)
  type: ConnectorType;
  /** 연결 정보 — 타입별로 다름 */
  credentials: ConnectorCredentials;
  /** 활성 여부 */
  enabled: boolean;
  /** 마지막 성공적 수집 시각 */
  lastFetchedAt?: Date;
  /** 마지막 에러 메시지 */
  lastError?: string;
}

export type ConnectorCredentials =
  | GoogleSheetsCredentials
  | GitHubCredentials
  | NotionCredentials
  | FigmaCredentials
  | GoogleCalendarCredentials
  | SlackCredentials
  | LinearCredentials;

export interface GoogleSheetsCredentials {
  type: 'google_sheets';
  spreadsheetUrl: string;    // URL에서 spreadsheetId 추출
  sheetName?: string;        // 특정 시트 (없으면 첫 번째)
  // Google Sheets API는 공개 시트면 API key만으로 읽기 가능
}

export interface GitHubCredentials {
  type: 'github';
  repoUrl: string;           // github.com/owner/repo
  // 공개 레포는 토큰 불필요, 비공개는 PAT 필요
  accessToken?: string;
}

export interface NotionCredentials {
  type: 'notion';
  pageUrl: string;            // notion.so/page-id
  integrationToken: string;   // Notion Integration Token
}

export interface FigmaCredentials {
  type: 'figma';
  fileUrl: string;            // figma.com/file/xxx
  accessToken: string;        // Figma Personal Access Token
}

export interface GoogleCalendarCredentials {
  type: 'google_calendar';
  calendarId: string;         // 공개 캘린더 ID
}

export interface SlackCredentials {
  type: 'slack';
  channelId: string;
  botToken: string;           // xoxb-...
}

export interface LinearCredentials {
  type: 'linear';
  teamId: string;
  apiKey: string;
}

// ── 수집 결과 ──

/** 각 커넥터가 반환하는 표준화된 수집 결과 */
export interface HarnessData {
  source: ConnectorType;
  fetchedAt: Date;
  /** 수집 성공 여부 */
  ok: boolean;
  error?: string;
  /** 아래 필드 중 해당하는 것만 채움 */
  activities?: Activity[];
  tasks?: TaskItem[];
  decisions?: DecisionItem[];
  resources?: ResourceItem[];
  events?: EventItem[];
  metrics?: MetricItem[];
}

/** 일반적인 활동 기록 (커밋, 메시지, 코멘트 등) */
export interface Activity {
  who: string;
  what: string;
  when: Date;
  url?: string;
}

/** 할 일 / 이슈 */
export interface TaskItem {
  assignee: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  deadline?: string;
  url?: string;
}

/** 결정사항 */
export interface DecisionItem {
  topic: string;
  result: string;
  decidedAt: Date;
}

/** 링크/자료 */
export interface ResourceItem {
  url: string;
  label: string;
  sharedBy: string;
  type: 'design' | 'document' | 'reference' | 'code' | 'link';
}

/** 일정/이벤트 */
export interface EventItem {
  title: string;
  startTime: Date;
  endTime?: Date;
  location?: string;
  attendees?: string[];
}

/** 정량적 지표 (행 수 변경, 커밋 수 등) */
export interface MetricItem {
  label: string;
  value: number;
  unit: string;     // "commits", "rows", "files" 등
  delta?: number;   // 전주 대비 변화
}

// ── 통합 하네스 컨텍스트 ──

/**
 * Ghostwriter에 전달되는 확장된 하네스 컨텍스트
 * 기존 HarnessContext를 포함하면서 멀티소스 데이터를 추가
 */
export interface EnrichedHarnessContext {
  // ── 기존 Discord 하네스 (그대로 유지) ──
  pinnedMessages?: any[];
  checkinMessages?: any[];
  channelName?: string;
  previousFeedback?: { weekNumber: number; score: number; note: string }[];
  settings?: {
    ai_tone?: 'formal' | 'casual' | 'english';
    min_messages?: number;
    custom_prompt_hint?: string | null;
  };

  // ── 봇 감지 데이터 ──
  botDetectedTasks?: TaskItem[];
  botDetectedDecisions?: DecisionItem[];
  botDetectedResources?: ResourceItem[];

  // ── 외부 소스 데이터 ──
  externalSources?: HarnessData[];

  // ── 과거 누적 컨텍스트 (이번 기수) ──
  historicalDecisions?: DecisionItem[];   // 과거 주요 결정
  historicalRetros?: string[];            // 과거 회고 교훈
}
