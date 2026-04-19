/**
 * Hard delete 크론: 30일 유예 경과한 soft-deleted 프로필을 영구 삭제 (PIPA 36조).
 *
 * 대상: `profiles.deleted_at < now() - 30 days`
 *
 * 절차:
 * 1. 대상 user_id 목록 조회
 * 2. auth.users 삭제 (cascade: profiles, club_members, applications 등 FK ON DELETE CASCADE)
 * 3. 감사 로그 기록 (actor_user_id=null = system)
 *
 * 실행: 매일 KST 03:00 (UTC 18:00)
 * 수동: POST /api/cron/purge-deleted-accounts
 * Authorization: Bearer <CRON_SECRET>
 */
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withCronCapture } from '@/src/lib/posthog/with-cron-capture'
import { writeAuditLog } from '@/src/lib/audit'

export const runtime = 'nodejs'
export const maxDuration = 60

const GRACE_DAYS = 30

export const POST = withCronCapture('purge-deleted-accounts', async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return ApiResponse.unauthorized()
  }

  const admin = createAdminClient()
  const cutoff = new Date(Date.now() - GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString()

  // 대상 목록 조회. select 'deleted_at' 문법은 타입 아직 반영 전이라 any 캐스트.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: targets, error: queryError } = await (admin as any)
    .from('profiles')
    .select('user_id, nickname, deleted_at')
    .lt('deleted_at', cutoff)
    .not('deleted_at', 'is', null)

  if (queryError) {
    return ApiResponse.internalError('대상 조회 실패', queryError.message)
  }

  const rows = (targets ?? []) as Array<{ user_id: string; nickname: string | null; deleted_at: string }>

  if (rows.length === 0) {
    return ApiResponse.ok({ processed: 0, message: '삭제 대상 없음' })
  }

  const results: Array<{ user_id: string; ok: boolean; error?: string }> = []

  // 개별 처리 — 하나 실패해도 나머지 계속
  for (const row of rows) {
    try {
      const { error: delErr } = await admin.auth.admin.deleteUser(row.user_id)

      if (delErr) {
        results.push({ user_id: row.user_id, ok: false, error: delErr.message })
        continue
      }

      // 감사 로그 (actor=null = system 크론)
      // auth.users 삭제 후에도 actor_user_id=null 은 허용.
      await writeAuditLog(admin, {
        actorUserId: null,
        action: 'profile.hard_delete',
        targetType: 'profile',
        targetId: row.user_id,
        context: {
          grace_period_days: GRACE_DAYS,
          soft_deleted_at: row.deleted_at,
          trigger: 'cron.purge-deleted-accounts',
        },
      })

      results.push({ user_id: row.user_id, ok: true })
    } catch (err) {
      results.push({
        user_id: row.user_id,
        ok: false,
        error: err instanceof Error ? err.message : 'unknown',
      })
    }
  }

  const succeeded = results.filter(r => r.ok).length
  const failed = results.length - succeeded

  return ApiResponse.ok({
    processed: results.length,
    succeeded,
    failed,
    cutoff,
    // 에러 케이스만 상세 반환 — 감사 추적용
    errors: results.filter(r => !r.ok),
  })
})
