import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { writeAuditLog, extractAuditContext } from '@/src/lib/audit'

/**
 * GET /api/me/export — 정보주체 열람권 (PIPA 35조) 대응.
 * 본인 계정과 관련된 모든 데이터를 JSON 덤프로 반환.
 *
 * 포함:
 * - profile
 * - club_members (자기 멤버십)
 * - applications (자기가 낸 지원)
 * - project_invitations (자기가 받은 초대)
 * - weekly_update_drafts (자기가 target인 초안)
 * - direct_messages (본인이 송/수신)
 * - coffee_chats
 * - audit_logs (본인 액션)
 *
 * 반환: Content-Disposition: attachment 로 json 다운로드.
 */
export const GET = withErrorCapture(async (request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  // 병렬로 모든 소스 조회. 에러는 개별 섹션만 null 로 떨어지고 나머지는 반환.
  const [
    profile,
    clubMembers,
    applications,
    invitations,
    drafts,
    sentMessages,
    receivedMessages,
    coffeeChatsInitiated,
    coffeeChatsReceived,
    auditLogs,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('club_members').select('*').eq('user_id', user.id),
    supabase.from('applications').select('*').eq('applicant_id', user.id),
    supabase.from('project_invitations').select('*').eq('invited_user_id', user.id),
    supabase.from('weekly_update_drafts').select('*').eq('target_user_id', user.id),
    supabase.from('direct_messages').select('*').eq('sender_id', user.id),
    supabase.from('direct_messages').select('*').eq('receiver_id', user.id),
    supabase.from('coffee_chats').select('*').eq('requester_user_id', user.id),
    supabase.from('coffee_chats').select('*').eq('owner_user_id', user.id),
    supabase.from('audit_logs').select('*').eq('actor_user_id', user.id).order('created_at', { ascending: false }).limit(500),
  ])

  const dump = {
    meta: {
      exported_at: new Date().toISOString(),
      user_id: user.id,
      email: user.email,
      purpose: 'PIPA Article 35 - Data subject right of access',
      format_version: 1,
    },
    profile: profile.data ?? null,
    club_memberships: clubMembers.data ?? [],
    applications: applications.data ?? [],
    invitations_received: invitations.data ?? [],
    weekly_update_drafts: drafts.data ?? [],
    messages_sent: sentMessages.data ?? [],
    messages_received: receivedMessages.data ?? [],
    coffee_chats_initiated: coffeeChatsInitiated.data ?? [],
    coffee_chats_received: coffeeChatsReceived.data ?? [],
    recent_audit_logs: auditLogs.data ?? [],
  }

  // P0-2 감사 로그 — 본인 데이터 열람 기록도 추적 (PIPA 준수 증빙)
  writeAuditLog(supabase, {
    actorUserId: user.id,
    action: 'profile.data_export',
    targetType: 'profile',
    targetId: user.id,
    context: extractAuditContext(request),
  })

  const body = JSON.stringify(dump, null, 2)
  const filename = `draft-export-${user.id}-${new Date().toISOString().slice(0, 10)}.json`

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
})
