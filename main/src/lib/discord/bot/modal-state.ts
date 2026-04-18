/**
 * Modal 2단계 플로우 상태 (인메모리)
 *
 * 투두 등록처럼 "Modal 입력 → 후속 User Select" 플로우에서 중간 상태를 보관합니다.
 * Discord Modal은 Select 컴포넌트를 담을 수 없어 2단계로 쪼갤 수밖에 없고,
 * 사이에 데이터가 필요하므로 짧은 수명(5분)의 인메모리 Map을 사용합니다.
 *
 * 이유 주석:
 * - DB 테이블 대신 Map 사용: 5분 내 완결되는 단순 세션이라 영속 저장소는 과함.
 *   서버 재시작 시 유실되면 사용자는 재입력하면 끝 — 데이터 손실 위험 0.
 * - 서버리스/멀티 인스턴스 한계: Next.js 인스턴스가 2개 이상 돌면 다른 인스턴스로
 *   라우팅된 USER_SELECT 응답에서는 상태를 못 찾을 수 있음. 이 경우에도 사용자는
 *   재입력으로 복구 가능. Vercel Serverless 환경에서는 같은 deployment의 warm instance가
 *   유지되면 동일 인스턴스로 라우팅되는 경향이 있어 대부분 문제 없음.
 */

export interface TodoDraft {
  content: string;
  deadline: string | null;
  requesterId: string;
  channelId: string;
  guildId: string;
  createdAt: number;
}

const STATE_TTL_MS = 5 * 60 * 1000; // 5분

const todoDrafts = new Map<string, TodoDraft>();

/** 랜덤 stateKey 생성 (custom_id 100자 제한 고려해 짧게) */
export function generateStateKey(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function setTodoDraft(key: string, draft: TodoDraft): void {
  todoDrafts.set(key, draft);
}

export function getTodoDraft(key: string): TodoDraft | null {
  const draft = todoDrafts.get(key);
  if (!draft) return null;
  if (Date.now() - draft.createdAt > STATE_TTL_MS) {
    todoDrafts.delete(key);
    return null;
  }
  return draft;
}

export function clearTodoDraft(key: string): void {
  todoDrafts.delete(key);
}

/** 만료된 엔트리 정리 (주기적으로 호출) */
export function cleanupTodoDrafts(): void {
  const cutoff = Date.now() - STATE_TTL_MS;
  for (const [key, draft] of todoDrafts) {
    if (draft.createdAt < cutoff) {
      todoDrafts.delete(key);
    }
  }
}

// 1분마다 자동 정리
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupTodoDrafts, 60 * 1000).unref?.();
}
