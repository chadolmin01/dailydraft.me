/**
 * 클럽 Ghostwriter 설정 API
 *
 * GET  — 현재 설정 조회 (없으면 기본값 반환)
 * PATCH — 설정 생성/수정 (upsert)
 *
 * 권한: GET=클럽 멤버, PATCH=클럽 관리자(owner/admin)
 */

import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse, isValidUUID, parseJsonBody } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import type { Database } from '@/src/types/database'

type GhostwriterSettingsInsert = Database['public']['Tables']['club_ghostwriter_settings']['Insert']

type RouteParams = { params: Promise<{ slug: string }> }

/** 시스템 기본값 — DB에 row가 없을 때 사용 */
const DEFAULTS = {
  checkin_template: null as string | null,
  checkin_day: 1,
  generate_day: 0,
  ai_tone: 'formal' as 'formal' | 'casual' | 'english',
  min_messages: 5,
  timeout_hours: 24,
  custom_prompt_hint: null as string | null,
}

export const GET = withErrorCapture(async (_request, { params }: RouteParams) => {
  const { slug: clubId } = await params
  if (!isValidUUID(clubId)) return ApiResponse.badRequest('유효하지 않은 클럽 ID입니다')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const admin = createAdminClient()

  const { data } = await admin
    .from('club_ghostwriter_settings')
    .select('*')
    .eq('club_id', clubId)
    .maybeSingle()

  // DB에 없으면 기본값 반환
  return ApiResponse.ok(data ?? { club_id: clubId, ...DEFAULTS })
})

export const PATCH = withErrorCapture(async (request, { params }: RouteParams) => {
  const { slug: clubId } = await params
  if (!isValidUUID(clubId)) return ApiResponse.badRequest('유효하지 않은 클럽 ID입니다')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  // 관리자 권한 확인
  const admin = createAdminClient()
  const { data: membership } = await admin
    .from('club_members')
    .select('role')
    .eq('club_id', clubId)
    .eq('user_id', user.id)
    .maybeSingle()

  const role = membership?.role
  if (role !== 'owner' && role !== 'admin') {
    return ApiResponse.forbidden('관리자만 설정을 변경할 수 있습니다')
  }

  const body = await parseJsonBody<{
    checkin_template?: string | null
    checkin_day?: number
    generate_day?: number
    ai_tone?: string
    min_messages?: number
    timeout_hours?: number
    custom_prompt_hint?: string | null
  }>(request)
  if (body instanceof Response) return body

  // 유효성 검사
  const errors: string[] = []

  if (body.checkin_day !== undefined && (body.checkin_day < 0 || body.checkin_day > 6)) {
    errors.push('checkin_day는 0(일)~6(토) 사이여야 합니다')
  }
  if (body.generate_day !== undefined && (body.generate_day < 0 || body.generate_day > 6)) {
    errors.push('generate_day는 0(일)~6(토) 사이여야 합니다')
  }
  if (body.ai_tone !== undefined && !['formal', 'casual', 'english'].includes(body.ai_tone)) {
    errors.push('ai_tone은 formal, casual, english 중 하나여야 합니다')
  }
  if (body.min_messages !== undefined && (body.min_messages < 1 || body.min_messages > 50)) {
    errors.push('min_messages는 1~50 사이여야 합니다')
  }
  if (body.timeout_hours !== undefined && (body.timeout_hours < 1 || body.timeout_hours > 168)) {
    errors.push('timeout_hours는 1~168 사이여야 합니다')
  }
  if (body.custom_prompt_hint && body.custom_prompt_hint.length > 200) {
    errors.push('custom_prompt_hint는 200자 이내여야 합니다')
  }

  if (errors.length > 0) {
    return ApiResponse.badRequest(errors.join(', '))
  }

  // upsert — 없으면 생성, 있으면 업데이트
  const upsertData: GhostwriterSettingsInsert = { club_id: clubId }
  if (body.checkin_template !== undefined) upsertData.checkin_template = body.checkin_template?.trim() || null
  if (body.checkin_day !== undefined) upsertData.checkin_day = body.checkin_day
  if (body.generate_day !== undefined) upsertData.generate_day = body.generate_day
  if (body.ai_tone !== undefined) upsertData.ai_tone = body.ai_tone
  if (body.min_messages !== undefined) upsertData.min_messages = body.min_messages
  if (body.timeout_hours !== undefined) upsertData.timeout_hours = body.timeout_hours
  if (body.custom_prompt_hint !== undefined) upsertData.custom_prompt_hint = body.custom_prompt_hint?.trim() || null

  const { data, error } = await admin
    .from('club_ghostwriter_settings')
    .upsert(upsertData, { onConflict: 'club_id' })
    .select('*')
    .single()

  if (error) {
    return ApiResponse.internalError('설정 저장에 실패했습니다')
  }

  return ApiResponse.ok(data)
})
