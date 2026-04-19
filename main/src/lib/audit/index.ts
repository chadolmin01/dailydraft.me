/**
 * 엔터프라이즈 감사 로그 헬퍼.
 *
 * 사용: 주요 운영/어드민 액션 수행 직후 `writeAuditLog` 호출.
 * 실패해도 원 플로우를 막지 않는 fire-and-forget 패턴 (로그는 silent fail).
 *
 * action 네이밍: '<resource>.<verb>' (snake_case).
 * - 'club_member.role_change'
 * - 'club_member.remove'
 * - 'clubs.delete'
 * - 'personas.publish'
 * - 'institution_member.invite'
 * - 'profile.delete_request'
 *
 * 민감정보 마스킹:
 * - password, token, secret 포함 필드는 diff 에 넣지 말 것
 * - student_id/contact_* 는 구체 값 대신 '(masked)' 로 표기 권장
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import type { Json } from '@/src/types/database'

export interface AuditLogEntry {
  action: string                  // '<resource>.<verb>' 형식
  targetType: string              // 'club_member', 'clubs', 'persona' 등
  targetId?: string | null
  actorUserId?: string | null     // null = system/cron
  diff?: { before?: unknown; after?: unknown } | null
  context?: Record<string, unknown> | null
}

const ACTION_REGEX = /^[a-z_]+\.[a-z_]+$/

/**
 * audit_logs INSERT. 실패해도 throw 하지 않음 (fire-and-forget).
 * service_role client 사용 권장 — RLS 우회 안 돼도 insert 정책이 actor=self/null 허용해서 큰 상관 없지만
 * 시스템 이벤트(actor=null)는 service_role 이 확실.
 */
export async function writeAuditLog(
  supabase: SupabaseClient,
  entry: AuditLogEntry,
): Promise<void> {
  if (!ACTION_REGEX.test(entry.action)) {
    console.warn('[audit] invalid action format (expected "<resource>.<verb>"):', entry.action)
    return
  }

  try {
    const { error } = await supabase
      .from('audit_logs')
      // types.generated.ts 에 audit_logs 가 아직 반영 안 됐을 수 있어 cast.
      // 마이그레이션 적용 후 `npm run db:types` 로 제거.
      .insert({
        actor_user_id: entry.actorUserId ?? null,
        action: entry.action,
        target_type: entry.targetType,
        target_id: entry.targetId ?? null,
        diff: (entry.diff ?? null) as Json,
        context: (entry.context ?? null) as Json,
      } as never)

    if (error) {
      console.warn('[audit] log insert failed:', error.message, { action: entry.action })
    }
  } catch (err) {
    console.warn('[audit] log unexpected error:', err)
  }
}

/**
 * NextRequest 에서 context 추출 (ip, user-agent 등).
 * API 라우트에서 editor 패턴으로 활용.
 */
export function extractAuditContext(request: NextRequest, extra?: Record<string, unknown>): Record<string, unknown> {
  const headers = request.headers
  return {
    ip:
      headers.get('cf-connecting-ip') ||
      headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headers.get('x-real-ip') ||
      null,
    user_agent: headers.get('user-agent') ?? null,
    ...extra,
  }
}

/**
 * 민감 필드 마스킹 유틸. diff 에 넣기 전 전처리용.
 */
export function maskSensitive<T extends Record<string, unknown>>(obj: T, keys: (keyof T)[]): T {
  const clone = { ...obj }
  for (const key of keys) {
    if (key in clone) {
      (clone as Record<string, unknown>)[key as string] = '(masked)'
    }
  }
  return clone
}
