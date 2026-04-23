import { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { captureServerEvent } from '@/src/lib/posthog/server'
import {
  notifyClubVerificationApproved,
  notifyClubVerificationRejected,
} from '@/src/lib/notifications/create-notification'

export const runtime = 'nodejs'

/**
 * POST /api/admin/clubs/[id]/review
 *
 * Platform admin 이 클럽 인증 신청을 승인/거부.
 * body: { action: 'approve' | 'reject', note?: string }
 *
 * approve:
 *   - clubs.claim_status = 'verified'
 *   - clubs.verification_reviewed_at = now(), reviewed_by = admin.id
 *   - club_credentials insert (credential_type='university', method='manual_admin')
 *   - creator 에게 성공 notification
 * reject:
 *   - clubs.claim_status = 'rejected', verification_note = note (필수)
 *   - creator 에게 거부 notification (재제출 안내)
 */
export const POST = withErrorCapture(
  async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id: clubId } = await ctx.params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    // platform admin 권한 확인 (RPC 타입은 generated types 에 없어 any 캐스팅)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: isAdminRow } = await (supabase as any)
      .rpc('is_platform_admin', { p_user_id: user.id })
    if (!isAdminRow) return ApiResponse.forbidden('관리자 권한이 필요합니다')

    const body = await request.json().catch(() => ({}))
    const { action, note } = body as { action?: string; note?: string }

    if (action !== 'approve' && action !== 'reject') {
      return ApiResponse.badRequest('action 은 approve 또는 reject 이어야 합니다')
    }
    if (action === 'reject' && (!note || !note.trim())) {
      return ApiResponse.badRequest('거부 사유를 입력해 주세요')
    }

    // 대상 클럽 조회 (pending 상태 + university_id 필수)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: club, error: fetchErr } = await (supabase as any)
      .from('clubs')
      .select('id, slug, name, created_by, claim_status, university_id')
      .eq('id', clubId)
      .maybeSingle()

    if (fetchErr || !club) return ApiResponse.notFound('클럽을 찾을 수 없습니다')
    if (club.claim_status !== 'pending') {
      return ApiResponse.badRequest(`이미 ${club.claim_status} 상태입니다`)
    }

    const nowIso = new Date().toISOString()

    if (action === 'approve') {
      // clubs 업데이트
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updErr } = await (supabase as any)
        .from('clubs')
        .update({
          claim_status: 'verified',
          verification_reviewed_at: nowIso,
          verification_reviewed_by: user.id,
          verification_note: note?.trim() || null,
        })
        .eq('id', clubId)
      if (updErr) return ApiResponse.internalError('승인 실패', updErr.message)

      // club_credentials insert (university badge)
      if (club.university_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('club_credentials')
          .insert({
            club_id: clubId,
            credential_type: 'university',
            university_id: club.university_id,
            verified_at: nowIso,
            verified_by: user.id,
            verification_method: 'manual_admin',
          })
          .then(() => {}, (err: Error) => {
            console.warn('[clubs/review] credential insert failed:', err.message)
          })
      }

      // creator notification — event_notifications 테이블로 통일.
      // 이전엔 legacy notifications 테이블에 insert 돼서 UI(bell·/notifications)에서 안 보이던 문제.
      await notifyClubVerificationApproved(club.created_by, club.name, club.slug)

      captureServerEvent('club_verification_approved', {
        adminId: user.id,
        clubId,
        slug: club.slug,
      }).catch(() => {})

      return ApiResponse.ok({ action: 'approve', clubId, slug: club.slug })
    }

    // reject
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updErr } = await (supabase as any)
      .from('clubs')
      .update({
        claim_status: 'rejected',
        verification_reviewed_at: nowIso,
        verification_reviewed_by: user.id,
        verification_note: note!.trim(),
      })
      .eq('id', clubId)
    if (updErr) return ApiResponse.internalError('거부 처리 실패', updErr.message)

    // event_notifications 테이블로 통일. 이전 legacy 테이블 → UI 누락 버그 수정.
    await notifyClubVerificationRejected(club.created_by, club.name, club.slug, note!.trim())

    captureServerEvent('club_verification_rejected', {
      adminId: user.id,
      clubId,
      slug: club.slug,
      reason: note!.trim(),
    }).catch(() => {})

    return ApiResponse.ok({ action: 'reject', clubId, slug: club.slug })
  }
)
