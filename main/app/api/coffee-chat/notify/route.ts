import { NextRequest } from 'next/server'
import { applyRateLimit, getClientIp } from '@/src/lib/rate-limit/api-rate-limiter'
import { ApiResponse } from '@/src/lib/api-utils'
import { logApiError } from '@/src/lib/error-logging'
import { resend, FROM_EMAIL, isEmailEnabled } from '@/src/lib/email/client'
import { renderCoffeeChatRequestEmail } from '@/src/lib/email/templates/coffee-chat-request'
import { renderCoffeeChatResponseEmail } from '@/src/lib/email/templates/coffee-chat-response'
import { notifyCoffeeChatRequest, notifyCoffeeChatResponse, notifyPersonCoffeeChatRequest, notifyPersonCoffeeChatResponse } from '@/src/lib/notifications/create-notification'
import { dmCoffeeChatRequest, dmPersonCoffeeChatRequest, dmCoffeeChatResponse, dmPersonCoffeeChatResponse } from '@/src/lib/discord/dm-notifications'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendPushToUser } from '@/src/lib/push-notification'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { APP_URL } from '@/src/constants'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export const POST = withErrorCapture(async (req: NextRequest) => {
    // 인증 검증: 로그인한 사용자만 이메일 발송 트리거 가능
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try { cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]) } catch { /* read-only in some contexts */ }
            })
          },
        },
      }
    )
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return ApiResponse.unauthorized()
    }

    // Rate limit
    const rateLimitResponse = applyRateLimit(user.id, getClientIp(req))
    if (rateLimitResponse) return rateLimitResponse

    if (!isEmailEnabled()) {
      return ApiResponse.serviceUnavailable('Email not configured')
    }

    const body = await req.json()
    const { type, chatId } = body as { type: 'request' | 'accepted' | 'declined'; chatId: string; invitationMessage?: string }

    if (!type || !chatId) {
      return ApiResponse.badRequest('Missing type or chatId')
    }

    // Fetch chat with related data
    const { data: chat, error: chatError } = await supabaseAdmin
      .from('coffee_chats')
      .select('*')
      .eq('id', chatId)
      .single()

    if (chatError || !chat) {
      return ApiResponse.notFound('채팅을 찾을 수 없습니다')
    }

    // 소유권 + 역할 검증: type별로 적절한 사용자만 트리거 가능
    const isRequester = chat.requester_user_id === user.id
    const isOwner = chat.owner_user_id === user.id
    if (!isRequester && !isOwner) {
      return ApiResponse.forbidden()
    }
    // request는 요청자만, accepted/declined는 오너만 트리거 가능
    if (type === 'request' && !isRequester) {
      return ApiResponse.forbidden()
    }
    if ((type === 'accepted' || type === 'declined') && !isOwner) {
      return ApiResponse.forbidden()
    }

    const isPersonMode = !chat.opportunity_id && !!chat.target_user_id

    // Fetch opportunity title (only for project mode)
    let projectTitle = '프로젝트'
    if (!isPersonMode && chat.opportunity_id) {
      const { data: opportunity } = await supabaseAdmin
        .from('opportunities')
        .select('title, creator_id')
        .eq('id', chat.opportunity_id)
        .single()
      projectTitle = opportunity?.title || '프로젝트'
    }

    // Fetch owner profile
    const { data: ownerProfile } = await supabaseAdmin
      .from('profiles')
      .select('nickname, contact_email')
      .eq('user_id', chat.owner_user_id)
      .single()

    // Fetch owner auth email
    const { data: ownerAuth } = await supabaseAdmin.auth.admin.getUserById(chat.owner_user_id)
    const ownerEmail = ownerProfile?.contact_email || ownerAuth?.user?.email
    const ownerName = ownerProfile?.nickname || 'User'
    const requesterName = chat.requester_name || chat.requester_email?.split('@')[0] || 'User'
    const requesterEmail = chat.requester_email

    if (type === 'request') {
      if (!ownerEmail) {
        return ApiResponse.validationError('Owner email not found')
      }

      const emailTitle = isPersonMode ? '개인 커피챗' : projectTitle
      const html = renderCoffeeChatRequestEmail({
        ownerName,
        requesterName,
        requesterMessage: chat.message || '(메시지 없음)',
        projectTitle: emailTitle,
        appUrl: APP_URL,
      })

      await resend?.emails.send({
        from: FROM_EMAIL,
        to: ownerEmail,
        subject: `[Draft] ${requesterName}님이 커피챗을 신청했습니다`,
        html,
      })

      // In-app notification
      if (isPersonMode) {
        await notifyPersonCoffeeChatRequest(chat.owner_user_id, requesterName)
      } else {
        await notifyCoffeeChatRequest(chat.owner_user_id, requesterName, projectTitle)
      }

      // Discord DM — fire-and-forget (실패해도 메인 흐름 보호)
      if (isPersonMode) {
        dmPersonCoffeeChatRequest(chat.owner_user_id, requesterName).catch(() => {})
      } else {
        dmCoffeeChatRequest(chat.owner_user_id, requesterName, projectTitle).catch(() => {})
      }

      // Web Push — 실패해도 메인 흐름 보호
      await sendPushToUser(chat.owner_user_id, {
        title: '☕ 커피챗 신청이 왔어요',
        body: `${requesterName}님이 커피챗을 신청했습니다.`,
        url: '/notifications',
      }).catch(err => console.warn('[notify] push 실패 (무시):', err))
    } else if (type === 'accepted' || type === 'declined') {
      if (!requesterEmail) {
        return ApiResponse.validationError('Requester email not found')
      }

      const emailTitle = isPersonMode ? '개인 커피챗' : projectTitle
      const html = renderCoffeeChatResponseEmail({
        requesterName,
        ownerName,
        projectTitle: emailTitle,
        accepted: type === 'accepted',
        contactInfo: type === 'accepted' ? chat.contact_info : undefined,
        appUrl: APP_URL,
      })

      await resend?.emails.send({
        from: FROM_EMAIL,
        to: requesterEmail,
        subject: `[Draft] 커피챗이 ${type === 'accepted' ? '수락' : '거절'}되었습니다`,
        html,
      })

      // In-app notification
      if (isPersonMode) {
        await notifyPersonCoffeeChatResponse(
          chat.requester_user_id,
          ownerName,
          type === 'accepted'
        )
      } else {
        await notifyCoffeeChatResponse(
          chat.requester_user_id,
          ownerName,
          projectTitle,
          type === 'accepted'
        )
      }

      // Discord DM — fire-and-forget
      if (isPersonMode) {
        dmPersonCoffeeChatResponse(chat.requester_user_id, ownerName, type === 'accepted').catch(() => {})
      } else {
        dmCoffeeChatResponse(chat.requester_user_id, ownerName, projectTitle, type === 'accepted').catch(() => {})
      }

      // Web Push — 실패해도 메인 흐름 보호
      await sendPushToUser(chat.requester_user_id, {
        title: type === 'accepted' ? '☕ 커피챗이 수락되었습니다' : '커피챗 결과 알림',
        body: type === 'accepted'
          ? `${ownerName} 님이 커피챗을 수락하셨습니다. 연락처를 확인하세요.`
          : `${ownerName} 님이 커피챗 신청을 수락하지 않으셨습니다.`,
        url: '/notifications',
      }).catch(err => console.warn('[notify] push 실패 (무시):', err))

      // Store invitation message if provided
      if (type === 'accepted' && body.invitationMessage) {
        await supabaseAdmin
          .from('coffee_chats')
          .update({ invitation_message: body.invitationMessage } as any)
          .eq('id', chatId)
      }

      // Auto-add to team when standalone project-based coffee chat is accepted
      // (application-linked coffee chats handle team-add via application accept flow)
      if (type === 'accepted' && !isPersonMode && chat.opportunity_id && !chat.application_id) {
        await supabaseAdmin
          .from('accepted_connections')
          .upsert(
            {
              coffee_chat_id: chatId,
              opportunity_creator_id: chat.owner_user_id,
              applicant_id: chat.requester_user_id,
              opportunity_id: chat.opportunity_id,
              status: 'active',
            } as never,
            { onConflict: 'coffee_chat_id' }
          )
      }
    }

    return ApiResponse.ok({ success: true })
})
