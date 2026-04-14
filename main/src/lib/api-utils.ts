import { NextResponse } from 'next/server'

// Standard error codes
export const ErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const

type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode]

interface ApiErrorOptions {
  code: ErrorCodeType
  message: string
  details?: unknown
}

// Standard error response
export function apiError(
  { code, message, details }: ApiErrorOptions,
  status: number
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(process.env.NODE_ENV === 'development' && details
          ? { details }
          : {}),
      },
    },
    { status }
  )
}

// Convenience methods
export const ApiResponse = {
  // Success responses
  ok: <T>(data: T) => NextResponse.json(data),

  created: <T>(data: T) => NextResponse.json(data, { status: 201 }),

  noContent: () => new NextResponse(null, { status: 204 }),

  // Error responses
  unauthorized: (message = '로그인이 필요합니다') =>
    apiError({ code: ErrorCode.UNAUTHORIZED, message }, 401),

  forbidden: (message = '접근 권한이 없습니다') =>
    apiError({ code: ErrorCode.FORBIDDEN, message }, 403),

  notFound: (message = '리소스를 찾을 수 없습니다') =>
    apiError({ code: ErrorCode.NOT_FOUND, message }, 404),

  badRequest: (message: string, details?: unknown) =>
    apiError({ code: ErrorCode.BAD_REQUEST, message, details }, 400),

  validationError: (message: string, details?: unknown) =>
    apiError({ code: ErrorCode.VALIDATION_ERROR, message, details }, 422),

  internalError: (message = '서버 오류가 발생했습니다', details?: unknown) =>
    apiError({ code: ErrorCode.INTERNAL_ERROR, message, details }, 500),

  rateLimited: (message = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요') =>
    apiError({ code: ErrorCode.RATE_LIMITED, message }, 429),

  conflict: (message: string) =>
    apiError({ code: ErrorCode.BAD_REQUEST, message }, 409),

  serviceUnavailable: (message = '서비스를 일시적으로 사용할 수 없습니다') =>
    apiError({ code: ErrorCode.SERVICE_UNAVAILABLE, message }, 503),
}

// Wrap async handler with error catching
export function withErrorHandler<T>(
  handler: (request: Request, context?: T) => Promise<NextResponse>
) {
  return async (request: Request, context?: T) => {
    try {
      return await handler(request, context)
    } catch (error) {
      if (error instanceof Error) {
        // Check for specific error types
        if (error.message.includes('JWT')) {
          return ApiResponse.unauthorized('세션이 만료되었습니다')
        }
        if (error.message.includes('rate limit')) {
          return ApiResponse.rateLimited()
        }

        return ApiResponse.internalError(
          process.env.NODE_ENV === 'development'
            ? error.message
            : '서버 오류가 발생했습니다',
          process.env.NODE_ENV === 'development' ? error.stack : undefined
        )
      }

      return ApiResponse.internalError()
    }
  }
}

// UUID v4 validation
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function isValidUUID(id: string): boolean {
  return UUID_RE.test(id)
}

// Safe JSON body parser — returns 400 instead of 500 on malformed input
export async function parseJsonBody<T = Record<string, unknown>>(request: Request): Promise<T | NextResponse> {
  try {
    return await request.json() as T
  } catch {
    return ApiResponse.badRequest('잘못된 요청 형식입니다')
  }
}

// Validate required fields
export function validateRequired(
  body: Record<string, unknown>,
  requiredFields: string[]
): { valid: boolean; missing: string[] } {
  const missing = requiredFields.filter(
    (field) => body[field] === undefined || body[field] === null || body[field] === ''
  )
  return {
    valid: missing.length === 0,
    missing,
  }
}
