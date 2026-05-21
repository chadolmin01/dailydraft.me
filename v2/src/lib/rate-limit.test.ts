import { describe, it, expect, beforeEach, vi } from 'vitest'
import { consumeToken } from './rate-limit'

describe('consumeToken', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  it('capacity 내에서는 모두 통과', () => {
    const key = `t1-${Date.now()}`
    for (let i = 0; i < 5; i++) {
      expect(consumeToken(key, { capacity: 5, refillMs: 1000 })).toBe(true)
    }
  })

  it('capacity 초과 시 false', () => {
    const key = `t2-${Date.now()}`
    for (let i = 0; i < 3; i++) {
      expect(consumeToken(key, { capacity: 3, refillMs: 1000 })).toBe(true)
    }
    expect(consumeToken(key, { capacity: 3, refillMs: 1000 })).toBe(false)
  })

  it('refill 시간 지나면 다시 통과', async () => {
    const key = `t3-${Date.now()}`
    expect(consumeToken(key, { capacity: 1, refillMs: 50 })).toBe(true)
    expect(consumeToken(key, { capacity: 1, refillMs: 50 })).toBe(false)
    // 50ms 대기
    await new Promise(r => setTimeout(r, 80))
    expect(consumeToken(key, { capacity: 1, refillMs: 50 })).toBe(true)
  })

  it('서로 다른 key 는 독립', () => {
    const k1 = `a-${Date.now()}`
    const k2 = `b-${Date.now()}`
    expect(consumeToken(k1, { capacity: 1, refillMs: 1000 })).toBe(true)
    expect(consumeToken(k2, { capacity: 1, refillMs: 1000 })).toBe(true)
    expect(consumeToken(k1, { capacity: 1, refillMs: 1000 })).toBe(false)
  })
})
