import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

// Lazy-init: 클라이언트 사이드에서 import 시 크래시 방지
let _supabaseAdmin: SupabaseClient | null = null
function getAdminClient(): SupabaseClient | null {
  if (typeof window !== 'undefined') return null // 브라우저에서는 로깅 스킵
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
  }
  return _supabaseAdmin
}

export type ErrorLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'
export type ErrorSource = 'api' | 'webhook' | 'cron' | 'client'

export interface LogErrorOptions {
  level?: ErrorLevel
  source?: ErrorSource
  errorCode?: string
  message: string
  stackTrace?: string
  endpoint?: string
  method?: string
  userId?: string
  requestBody?: Record<string, unknown>
  requestHeaders?: Record<string, string>
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

/**
 * Log an error to the database
 */
export async function logError(options: LogErrorOptions): Promise<void> {
  try {
    const {
      level = 'error',
      source = 'api',
      errorCode,
      message,
      stackTrace,
      endpoint,
      method,
      userId,
      requestBody,
      requestHeaders,
      metadata,
      ipAddress,
      userAgent,
    } = options

    // Sanitize sensitive data from headers
    const sanitizedHeaders = requestHeaders
      ? sanitizeHeaders(requestHeaders)
      : undefined

    // Sanitize sensitive data from body
    const sanitizedBody = requestBody
      ? sanitizeBody(requestBody)
      : undefined

    const admin = getAdminClient()
    if (!admin) {
      console.error('[ErrorLogger] Server-side only. Skipping DB log:', options.message)
      return
    }

    await admin.from('error_logs').insert({
      level,
      source,
      error_code: errorCode,
      message: truncate(message, 5000),
      stack_trace: stackTrace ? truncate(stackTrace, 10000) : null,
      endpoint,
      method,
      user_id: userId || null,
      request_body: sanitizedBody,
      request_headers: sanitizedHeaders,
      metadata,
      ip_address: ipAddress,
      user_agent: userAgent,
    })
  } catch (err) {
    // If logging fails, at least console.error it
    console.error('[ErrorLogger] Failed to log error:', err)
    console.error('[ErrorLogger] Original error:', options.message)
  }
}

/**
 * Helper to extract info from NextRequest and log error
 */
export async function logApiError(
  error: Error | unknown,
  request: NextRequest,
  options: Partial<LogErrorOptions> = {}
): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error))

  const endpoint = new URL(request.url).pathname
  const method = request.method
  const ipAddress = getClientIp(request)
  const userAgent = request.headers.get('user-agent') || undefined

  // Try to get request body if available
  let requestBody: Record<string, unknown> | undefined
  try {
    const clonedRequest = request.clone()
    const contentType = request.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      requestBody = await clonedRequest.json()
    }
  } catch {
    // Body might already be consumed or not JSON
  }

  // Extract headers
  const requestHeaders: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    requestHeaders[key] = value
  })

  await logError({
    level: options.level || 'error',
    source: options.source || 'api',
    errorCode: options.errorCode || err.name,
    message: err.message,
    stackTrace: err.stack,
    endpoint,
    method,
    requestBody,
    requestHeaders,
    ipAddress,
    userAgent,
    ...options,
  })
}

/**
 * Log webhook errors with specific context
 */
export async function logWebhookError(
  error: Error | unknown,
  webhookType: string,
  payload: Record<string, unknown>,
  options: Partial<LogErrorOptions> = {}
): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error))

  await logError({
    level: 'error',
    source: 'webhook',
    errorCode: err.name,
    message: err.message,
    stackTrace: err.stack,
    endpoint: `/api/webhooks/${webhookType}`,
    method: 'POST',
    requestBody: payload,
    metadata: {
      webhookType,
      ...options.metadata,
    },
    ...options,
  })
}

/**
 * Log cron job errors
 */
export async function logCronError(
  error: Error | unknown,
  jobName: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error))

  await logError({
    level: 'error',
    source: 'cron',
    errorCode: err.name,
    message: err.message,
    stackTrace: err.stack,
    endpoint: jobName,
    metadata,
  })
}

// Helper functions

function getClientIp(request: NextRequest): string | undefined {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    undefined
  )
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'authorization',
  'cookie',
  'api_key',
  'apikey',
  'api-key',
  'credit_card',
  'card_number',
  'cvv',
  'ssn',
]

export function sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase()
    if (SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]'
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}

export function sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(body)) {
    const lowerKey = key.toLowerCase()
    if (SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeBody(value as Record<string, unknown>)
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}

// Export types for use in other files
export type { LogErrorOptions as ErrorLogOptions }
