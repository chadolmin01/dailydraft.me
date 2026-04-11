import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse, parseJsonBody } from '@/src/lib/api-utils'
import { getInstitutionId } from '@/src/lib/institution/auth'
import { resend, FROM_EMAIL, isEmailEnabled } from '@/src/lib/email/client'
import { renderInstitutionAnnounceEmail } from '@/src/lib/email/templates/institution-announce'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { applyRateLimit, getClientIp } from '@/src/lib/rate-limit/api-rate-limiter'
import { APP_URL } from '@/src/constants'
import type { NextRequest } from 'next/server'

export const POST = withErrorCapture(async (request: NextRequest) => {
  if (!isEmailEnabled()) {
    return ApiResponse.serviceUnavailable('이메일 서비스가 설정되지 않았습니다')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  // Rate limit — 기관 이메일 대량 발송 남용 방지 (분당 60회)
  const rateLimitResponse = applyRateLimit(user.id, getClientIp(request))
  if (rateLimitResponse) return rateLimitResponse

  const institutionId = await getInstitutionId(supabase, user.id)
  if (!institutionId) return ApiResponse.forbidden('기관 관리자 권한이 필요합니다')

  const body = await parseJsonBody<{ subject: string; body: string }>(request)
  if (body instanceof Response) return body as any

  const { subject, body: emailBody } = body
  if (!subject?.trim() || !emailBody?.trim()) {
    return ApiResponse.badRequest('제목과 내용을 입력해주세요')
  }
  if (subject.length > 100) {
    return ApiResponse.badRequest('제목은 100자 이하로 입력해주세요')
  }
  if (emailBody.length > 5000) {
    return ApiResponse.badRequest('내용은 5000자 이하로 입력해주세요')
  }

  // Get institution name
  const { data: institution } = await supabase
    .from('institutions')
    .select('name')
    .eq('id', institutionId)
    .single()

  const institutionName = institution?.name || '기관'

  // Get all active members with their profile emails
  const { data: members } = await supabase
    .from('institution_members')
    .select('user_id')
    .eq('institution_id', institutionId)
    .eq('status', 'active')

  const memberIds = (members || []).map((m) => m.user_id)
  if (memberIds.length === 0) {
    return ApiResponse.badRequest('발송 대상 멤버가 없습니다')
  }

  // Get profiles for email addresses and names
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, nickname, contact_email')
    .in('user_id', memberIds)

  // Build recipient list (skip members without email)
  const recipients = (profiles || [])
    .filter((p) => p.contact_email)
    .map((p) => ({
      email: p.contact_email as string,
      name: p.nickname || '멤버',
    }))

  if (recipients.length === 0) {
    return ApiResponse.badRequest('이메일 주소가 등록된 멤버가 없습니다')
  }

  // Send emails with rate limiting
  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const recipient of recipients) {
    try {
      const html = renderInstitutionAnnounceEmail({
        recipientName: recipient.name,
        institutionName,
        subject: subject.trim(),
        body: emailBody.trim(),
        appUrl: APP_URL,
      })

      const { error } = await resend!.emails.send({
        from: FROM_EMAIL,
        to: recipient.email,
        subject: `[${institutionName}] ${subject.trim()}`,
        html,
      })

      if (error) {
        failed++
        errors.push(`${recipient.email}: ${error.message}`)
      } else {
        sent++
      }
    } catch {
      failed++
    }

    // Rate limit: 100ms between emails
    if (recipients.indexOf(recipient) < recipients.length - 1) {
      await new Promise((r) => setTimeout(r, 100))
    }
  }

  return ApiResponse.ok({
    sent,
    failed,
    total: recipients.length,
    ...(errors.length > 0 && process.env.NODE_ENV === 'development' ? { errors } : {}),
  })
})
