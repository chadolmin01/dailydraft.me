import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('cookie-signature', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('signs and verifies a cookie value', async () => {
    vi.stubEnv('COOKIE_SECRET', 'test-secret-key-for-hmac-256')
    const { signCookie, verifyCookie } = await import('../cookie-signature')

    const signed = await signCookie('true')
    expect(signed).toContain('.')
    expect(signed.startsWith('true.')).toBe(true)

    const verified = await verifyCookie(signed)
    expect(verified).toBe('true')

    vi.unstubAllEnvs()
  })

  it('rejects tampered cookies', async () => {
    vi.stubEnv('COOKIE_SECRET', 'test-secret-key-for-hmac-256')
    const { signCookie, verifyCookie } = await import('../cookie-signature')

    const signed = await signCookie('true')
    const tampered = signed.replace('true', 'false')

    const verified = await verifyCookie(tampered)
    expect(verified).toBeNull()

    vi.unstubAllEnvs()
  })

  it('rejects invalid signature format', async () => {
    vi.stubEnv('COOKIE_SECRET', 'test-secret-key-for-hmac-256')
    const { verifyCookie } = await import('../cookie-signature')

    const verified = await verifyCookie('no-dot-here')
    expect(verified).toBeNull()

    vi.unstubAllEnvs()
  })

  it('returns plain value when no secret configured', async () => {
    vi.stubEnv('COOKIE_SECRET', '')
    const { signCookie, verifyCookie } = await import('../cookie-signature')

    const signed = await signCookie('value')
    expect(signed).toBe('value') // no signing

    const verified = await verifyCookie('value')
    expect(verified).toBe('value') // pass through

    vi.unstubAllEnvs()
  })
})
