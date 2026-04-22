/**
 * Onboarding draft 로컬 저장 계층.
 *
 * 목적:
 *   - 네트워크 실패·브라우저 크래시·세션 만료 어떤 상황에서도 입력값을 잃지 않는다.
 *   - 2초 debounce 로 로컬에 스냅샷 → DB 저장 전에도 복구 가능.
 *   - 재진입 시 "이전에 입력하신 내용을 이어서 작성하시겠습니까?" 배너로 복구 제안.
 *
 * 저장 위치:
 *   - localStorage — 브라우저 종료해도 유지, 같은 기기 재진입 시 유효
 *   - sessionStorage — 탭 내에서만 유효, 인터뷰 페이지로 draft 전달용 (기존 호환)
 *
 * 키 네이밍:
 *   - draft:onboarding:v2      — 최신 스냅샷 (JSON)
 *   - draft:onboarding:meta:v2 — 메타 (savedAt, step, progress)
 *
 * 버전 접미사 (v2) 는 스키마 변경 시 호환 관리용.
 */

import type { ProfileDraft } from './types'

const STORAGE_KEY = 'draft:onboarding:v2'
const META_KEY = 'draft:onboarding:meta:v2'
const LEGACY_SESSION_KEY = 'onboarding-draft' // 기존 호환

export interface DraftMeta {
  /** ISO timestamp of last successful save */
  savedAt: string
  /** 현재 어디까지 왔는가 (step name) — 재진입 시 resume 경로 결정 */
  step?: string
  /** 진행률 0~100 (UI 표시용) */
  progress?: number
  /** 저장 상태 */
  status?: 'saving' | 'saved' | 'error'
}

export interface StoredDraft {
  draft: ProfileDraft
  meta: DraftMeta
}

/** 로컬에 저장. 예외 안전 (localStorage 쿼터 초과·SSR 등). */
export function saveDraftLocal(draft: ProfileDraft, meta: Partial<DraftMeta> = {}): boolean {
  if (typeof window === 'undefined') return false
  try {
    const nextMeta: DraftMeta = {
      savedAt: new Date().toISOString(),
      status: 'saved',
      ...meta,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
    window.localStorage.setItem(META_KEY, JSON.stringify(nextMeta))
    // 기존 세션 호환: /onboarding/interview 가 읽는 키도 같이 갱신
    window.sessionStorage.setItem(LEGACY_SESSION_KEY, JSON.stringify(draft))
    return true
  } catch (err) {
    // 쿼터 초과·프라이빗 모드 등. 조용히 실패하고 서버 저장만 신뢰.
    console.warn('[draft-storage] saveDraftLocal failed', err)
    return false
  }
}

/** 로컬에서 복원. 없거나 파싱 실패 시 null. */
export function loadDraftLocal(): StoredDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const metaRaw = window.localStorage.getItem(META_KEY)
    if (!raw) return null
    const draft = JSON.parse(raw) as ProfileDraft
    const meta: DraftMeta = metaRaw
      ? (JSON.parse(metaRaw) as DraftMeta)
      : { savedAt: new Date().toISOString() }
    return { draft, meta }
  } catch (err) {
    console.warn('[draft-storage] loadDraftLocal failed', err)
    return null
  }
}

/** 스냅샷 삭제 — 온보딩 최종 완료 직후 호출. */
export function clearDraftLocal(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    window.localStorage.removeItem(META_KEY)
    window.sessionStorage.removeItem(LEGACY_SESSION_KEY)
  } catch {
    // swallow
  }
}

/** 스냅샷이 너무 오래된 경우 (7일) 신뢰할 수 없으므로 자동 폐기. */
export function pruneStaleDraft(maxAgeDays = 7): void {
  const stored = loadDraftLocal()
  if (!stored) return
  const savedAt = new Date(stored.meta.savedAt).getTime()
  const ageMs = Date.now() - savedAt
  if (ageMs > maxAgeDays * 24 * 60 * 60 * 1000) {
    clearDraftLocal()
  }
}

/** 저장된 draft 에 의미 있는 내용이 있는지 (복구 제안 여부 결정). */
export function hasMeaningfulDraft(draft: ProfileDraft | null | undefined): boolean {
  if (!draft) return false
  return Boolean(
    draft.name?.trim() ||
      draft.position ||
      draft.skills?.length ||
      draft.interests?.length ||
      draft.source,
  )
}
