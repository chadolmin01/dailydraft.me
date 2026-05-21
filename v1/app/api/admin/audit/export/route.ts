import { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { isPlatformAdmin } from '@/src/lib/auth/platform-admin'

export const runtime = 'nodejs'

/**
 * GET /api/admin/audit/export?from=&to=&action=
 *
 * audit_logs CSV 다운로드 — 컴플라이언스·감사 자료 반출용.
 *
 * 보안:
 *   - Platform admin 만.
 *   - 본 export 자체도 audit_logs 에 'audit.exported' 로 기록 (역감사).
 *   - 최대 10,000 rows — 초과분은 범위 좁혀서 재요청 필요.
 *
 * 포맷: application/csv + Content-Disposition attachment
 *   컬럼: id, created_at, actor_user_id, action, target_type, target_id, diff_json, ctx_json
 */
export const GET = withErrorCapture(async (request: NextRequest) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()
  if (!(await isPlatformAdmin(supabase, user))) {
    return ApiResponse.forbidden('플랫폼 관리자만 감사 로그를 내보낼 수 있습니다')
  }

  const url = new URL(request.url)
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  const action = url.searchParams.get('action')
  const MAX = 10_000

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = admin
    .from('audit_logs')
    .select('id, created_at, actor_user_id, action, target_type, target_id, diff, context')
    .order('created_at', { ascending: false })
    .limit(MAX)

  if (from) q = q.gte('created_at', from)
  if (to) q = q.lt('created_at', to)
  if (action) {
    if (action.endsWith('.')) q = q.like('action', `${action}%`)
    else q = q.eq('action', action)
  }

  const { data, error } = await q
  if (error) return ApiResponse.internalError(error.message)

  const rows = (data ?? []) as Array<{
    id: string
    created_at: string
    actor_user_id: string | null
    action: string
    target_type: string
    target_id: string | null
    diff: unknown
    context: unknown
  }>

  const header = ['id', 'created_at', 'actor_user_id', 'action', 'target_type', 'target_id', 'diff_json', 'ctx_json']
  const esc = (v: unknown): string => {
    if (v === null || v === undefined) return ''
    const s = typeof v === 'string' ? v : JSON.stringify(v)
    // RFC 4180 — 필드 내 따옴표는 두 번으로 이스케이프, 구분자/줄바꿈 포함 시 전체를 "..." 로 감쌈
    if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const csvLines = [
    header.join(','),
    ...rows.map((r) =>
      [
        esc(r.id),
        esc(r.created_at),
        esc(r.actor_user_id),
        esc(r.action),
        esc(r.target_type),
        esc(r.target_id),
        esc(r.diff),
        esc(r.context),
      ].join(','),
    ),
  ]
  const csv = csvLines.join('\r\n')

  // 역감사 — export 자체를 기록
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('audit_logs').insert({
    actor_user_id: user.id,
    action: 'audit.exported',
    target_type: 'audit_logs',
    target_id: null,
    diff: null,
    context: {
      from: from ?? null,
      to: to ?? null,
      action_filter: action ?? null,
      rows_returned: rows.length,
      truncated: rows.length === MAX,
    },
  })

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="audit-logs-${stamp}.csv"`,
      'Cache-Control': 'no-store',
      'X-Rows-Returned': String(rows.length),
      'X-Max-Rows': String(MAX),
    },
  })
})
