/**
 * PWA 설치 유도 — 행동 기반 트리거
 *
 * 트리거 조건:
 * - 프로젝트 카드 3회 클릭 (세션 내)
 * - 로그인 직후 (세션 내 최초 1회)
 * - 관심/지원 액션 (즉시)
 */

const SESSION_VIEWS_KEY = 'draft_pwa_project_views'
const SESSION_PROMPTED_KEY = 'draft_pwa_prompted'
const VIEWS_THRESHOLD = 3

function alreadyPromptedThisSession(): boolean {
  try {
    return !!sessionStorage.getItem(SESSION_PROMPTED_KEY)
  } catch {
    return false
  }
}

function markPrompted(): void {
  try {
    sessionStorage.setItem(SESSION_PROMPTED_KEY, '1')
  } catch {}
}

export function triggerInstallPrompt(): void {
  if (typeof window === 'undefined') return
  if (alreadyPromptedThisSession()) return
  markPrompted()
  window.dispatchEvent(new CustomEvent('draft:pwa-prompt'))
}

export function trackProjectView(): void {
  if (typeof window === 'undefined') return
  if (alreadyPromptedThisSession()) return

  try {
    const count = parseInt(sessionStorage.getItem(SESSION_VIEWS_KEY) || '0') + 1
    sessionStorage.setItem(SESSION_VIEWS_KEY, String(count))
    if (count >= VIEWS_THRESHOLD) {
      triggerInstallPrompt()
    }
  } catch {}
}
