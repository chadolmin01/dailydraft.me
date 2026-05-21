// Google API 호출용 exponential backoff 재시도.
// 429 / 5xx 만 재시도, 4xx (인증/권한) 는 즉시 throw.

interface RetryOptions {
  attempts?: number       // 총 시도 횟수 (기본 3)
  baseDelayMs?: number    // 첫 재시도 대기 (기본 400)
  maxDelayMs?: number     // 최대 대기 (기본 4000)
}

const RETRY_STATUS = new Set([429, 500, 502, 503, 504])

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  opts: RetryOptions = {},
): Promise<Response> {
  const attempts = opts.attempts ?? 3
  const baseDelay = opts.baseDelayMs ?? 400
  const maxDelay = opts.maxDelayMs ?? 4000

  let lastError: unknown = null
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(input, init)
      if (res.ok || !RETRY_STATUS.has(res.status)) return res
      lastError = new Error(`HTTP ${res.status}`)
    } catch (e) {
      // 네트워크 에러 — 재시도 대상
      lastError = e
    }

    if (i < attempts - 1) {
      const delay = Math.min(baseDelay * 2 ** i + Math.random() * 200, maxDelay)
      await new Promise(r => setTimeout(r, delay))
    }
  }

  // 마지막 시도까지 실패 → 마지막 응답을 한 번 더 (호출자가 status 보고 결정)
  return fetch(input, init)
}
