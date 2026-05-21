import { describe, it, expect, vi } from 'vitest'
import { withRetry } from '../query-utils'

describe('withRetry', () => {
  it('returns result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    const result = await withRetry(fn)
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries on AbortError', async () => {
    const abortError = new DOMException('Aborted', 'AbortError')
    const fn = vi.fn()
      .mockRejectedValueOnce(abortError)
      .mockResolvedValueOnce('ok')

    const result = await withRetry(fn, 1)
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('throws non-AbortError immediately', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('network error'))
    await expect(withRetry(fn)).rejects.toThrow('network error')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('throws after retries exhausted', async () => {
    const abortError = new DOMException('Aborted', 'AbortError')
    const fn = vi.fn().mockRejectedValue(abortError)

    await expect(withRetry(fn, 1)).rejects.toThrow()
    expect(fn).toHaveBeenCalledTimes(2) // initial + 1 retry
  })

  it('respects custom retry count', async () => {
    const abortError = new DOMException('Aborted', 'AbortError')
    const fn = vi.fn()
      .mockRejectedValueOnce(abortError)
      .mockRejectedValueOnce(abortError)
      .mockResolvedValueOnce('ok')

    const result = await withRetry(fn, 2)
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(3)
  })
})
