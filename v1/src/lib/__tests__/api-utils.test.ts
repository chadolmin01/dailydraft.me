import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiResponse, apiError, ErrorCode, validateRequired } from '../api-utils'

describe('ApiResponse', () => {
  describe('ok', () => {
    it('returns 200 with data', async () => {
      const res = ApiResponse.ok({ name: 'test' })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toEqual({ name: 'test' })
    })
  })

  describe('created', () => {
    it('returns 201 with data', async () => {
      const res = ApiResponse.created({ id: '1' })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body).toEqual({ id: '1' })
    })
  })

  describe('noContent', () => {
    it('returns 204 with no body', () => {
      const res = ApiResponse.noContent()
      expect(res.status).toBe(204)
    })
  })

  describe('unauthorized', () => {
    it('returns 401 with default message', async () => {
      const res = ApiResponse.unauthorized()
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error.code).toBe('UNAUTHORIZED')
      expect(body.error.message).toBe('로그인이 필요합니다')
    })
  })

  describe('forbidden', () => {
    it('returns 403 with default message', async () => {
      const res = ApiResponse.forbidden()
      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.error.code).toBe('FORBIDDEN')
    })
  })

  describe('notFound', () => {
    it('returns 404', async () => {
      const res = ApiResponse.notFound()
      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.error.code).toBe('NOT_FOUND')
    })
  })

  describe('badRequest', () => {
    it('returns 400 with message', async () => {
      const res = ApiResponse.badRequest('잘못된 요청입니다')
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error.message).toBe('잘못된 요청입니다')
    })
  })

  describe('internalError', () => {
    it('returns 500 with default message', async () => {
      const res = ApiResponse.internalError()
      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.error.code).toBe('INTERNAL_ERROR')
      expect(body.error.message).toBe('서버 오류가 발생했습니다')
    })

    it('hides details in production', async () => {
      const originalEnv = process.env.NODE_ENV
      vi.stubEnv('NODE_ENV', 'production')

      const res = ApiResponse.internalError('오류', 'sensitive SQL error')
      const body = await res.json()
      expect(body.error.details).toBeUndefined()

      vi.stubEnv('NODE_ENV', originalEnv!)
    })

    it('shows details in development', async () => {
      vi.stubEnv('NODE_ENV', 'development')

      const res = ApiResponse.internalError('오류', 'debug info')
      const body = await res.json()
      expect(body.error.details).toBe('debug info')

      vi.unstubAllEnvs()
    })
  })

  describe('rateLimited', () => {
    it('returns 429', async () => {
      const res = ApiResponse.rateLimited()
      expect(res.status).toBe(429)
      const body = await res.json()
      expect(body.error.code).toBe('RATE_LIMITED')
    })
  })
})

describe('apiError', () => {
  it('structures error response correctly', async () => {
    const res = apiError(
      { code: ErrorCode.BAD_REQUEST, message: 'test error' },
      400
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('BAD_REQUEST')
    expect(body.error.message).toBe('test error')
  })
})

describe('validateRequired', () => {
  it('returns valid when all fields present', () => {
    const result = validateRequired(
      { name: 'test', email: 'test@test.com' },
      ['name', 'email']
    )
    expect(result.valid).toBe(true)
    expect(result.missing).toEqual([])
  })

  it('returns missing fields', () => {
    const result = validateRequired(
      { name: 'test' },
      ['name', 'email', 'phone']
    )
    expect(result.valid).toBe(false)
    expect(result.missing).toEqual(['email', 'phone'])
  })

  it('treats empty string as missing', () => {
    const result = validateRequired({ name: '' }, ['name'])
    expect(result.valid).toBe(false)
    expect(result.missing).toEqual(['name'])
  })

  it('treats null as missing', () => {
    const result = validateRequired({ name: null }, ['name'])
    expect(result.valid).toBe(false)
  })
})
