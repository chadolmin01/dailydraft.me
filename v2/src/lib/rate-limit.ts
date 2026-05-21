// 단순 in-memory rate limiter — V1 단일 사용자 환경에서 자기 방어용.
//
// 제한:
//   - Vercel serverless 는 인스턴스별 메모리 → 인스턴스가 늘어나면 리미트가 부드럽게 풀림
//   - cold start 시 카운터 초기화 (해당 인스턴스 한정)
//   - 진짜 멀티 테넌트 + 강한 보장 필요해지면 Vercel KV / Upstash 로 교체
//
// 사용:
//   const ok = consumeToken(userId, { capacity: 30, refillMs: 60_000 })
//   if (!ok) return ApiResponse.rateLimited()

interface Bucket {
  tokens: number
  lastRefill: number
}

const buckets = new Map<string, Bucket>()

// 너무 많은 키가 쌓이지 않도록 주기적 정리 (LRU 단순 버전)
const MAX_BUCKETS = 1000

interface Options {
  capacity: number   // 최대 토큰 (= 한 윈도우 안 허용 요청 수)
  refillMs: number   // 1 토큰 충전 간격 — capacity * refillMs 가 사실상 윈도우
}

export function consumeToken(key: string, { capacity, refillMs }: Options): boolean {
  const now = Date.now()
  let bucket = buckets.get(key)

  if (!bucket) {
    if (buckets.size >= MAX_BUCKETS) {
      // 가장 오래된 항목 제거 (Map 은 insertion order 유지)
      const firstKey = buckets.keys().next().value
      if (firstKey !== undefined) buckets.delete(firstKey)
    }
    bucket = { tokens: capacity, lastRefill: now }
    buckets.set(key, bucket)
  }

  // 흘러간 시간만큼 충전
  const elapsed = now - bucket.lastRefill
  const refilled = Math.floor(elapsed / refillMs)
  if (refilled > 0) {
    bucket.tokens = Math.min(capacity, bucket.tokens + refilled)
    bucket.lastRefill = bucket.lastRefill + refilled * refillMs
  }

  if (bucket.tokens > 0) {
    bucket.tokens -= 1
    return true
  }
  return false
}

// 다음 토큰까지 남은 ms (UI 에 안내용)
export function nextTokenInMs(key: string, refillMs: number): number {
  const bucket = buckets.get(key)
  if (!bucket) return 0
  const elapsed = Date.now() - bucket.lastRefill
  return Math.max(0, refillMs - (elapsed % refillMs))
}
