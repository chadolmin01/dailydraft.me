/**
 * GET /api/health — 시스템 헬스체크 (공개 엔드포인트, 인증 불필요).
 *
 * 반환: { status, timestamp, release, checks: { db, auth } }
 *
 * Status Page 가 주기 polling. 가벼운 쿼리만 수행.
 * `dynamic = 'force-dynamic'` 로 캐시 방지 — 실시간 상태 필요.
 */
import { ApiResponse } from '@/src/lib/api-utils'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { getReleaseTag } from '@/src/lib/alerts/discord-alert'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface CheckResult {
  ok: boolean
  durationMs: number
  error?: string
}

async function checkDb(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const admin = createAdminClient()
    // 작고 빠른 쿼리 — universities 는 시드 데이터 있는 참조 테이블
    const { error } = await admin
      .from('universities')
      .select('id', { count: 'exact', head: true })
      .limit(1)
    const durationMs = Date.now() - start
    if (error) return { ok: false, durationMs, error: error.message }
    return { ok: true, durationMs }
  } catch (err) {
    return {
      ok: false,
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : 'unknown',
    }
  }
}

async function checkAuth(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const admin = createAdminClient()
    // Auth 서버 ping — admin listUsers perPage=1 로 최소 호출
    const { error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 })
    const durationMs = Date.now() - start
    if (error) return { ok: false, durationMs, error: error.message }
    return { ok: true, durationMs }
  } catch (err) {
    return {
      ok: false,
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : 'unknown',
    }
  }
}

export async function GET() {
  const [db, auth] = await Promise.all([checkDb(), checkAuth()])
  const allOk = db.ok && auth.ok

  return ApiResponse.ok({
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    release: getReleaseTag(),
    env: process.env.VERCEL_ENV ?? 'unknown',
    checks: { db, auth },
  })
}
