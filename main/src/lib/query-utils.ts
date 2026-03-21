/**
 * AbortError 방어: Supabase 클라이언트에서 AbortError 발생 시 1회 재시도
 * 브라우저 탭 전환/네트워크 변동 시 AbortError가 발생할 수 있음
 */
export async function withRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    if (retries > 0 && err instanceof DOMException && err.name === 'AbortError') {
      await new Promise(r => setTimeout(r, 300))
      return withRetry(fn, retries - 1)
    }
    throw err
  }
}
