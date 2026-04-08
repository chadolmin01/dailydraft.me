/**
 * AbortError 방어 + hang 방어
 * - AbortError: 탭 전환/네트워크 변동 시 1회 재시도
 * - timeout: supabase 요청이 응답 없이 매달릴 경우(예: navigator.locks 경합)
 *   skeleton 영구 고착 방지 — reject 후 React Query retry에 위임
 */
const DEFAULT_TIMEOUT_MS = 12000

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 1,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  try {
    return await Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`query timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ])
  } catch (err) {
    if (retries > 0 && err instanceof DOMException && err.name === 'AbortError') {
      await new Promise(r => setTimeout(r, 300))
      return withRetry(fn, retries - 1, timeoutMs)
    }
    throw err
  }
}
