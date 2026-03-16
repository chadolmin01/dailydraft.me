import { NextRequest, NextResponse } from 'next/server'
import { applyRateLimit, getClientIp } from '@/src/lib/rate-limit/api-rate-limiter'
import { logApiError } from '@/src/lib/error-logging'
import { resend, FROM_EMAIL, isEmailEnabled } from '@/src/lib/email/client'
import { renderCoffeeChatRequestEmail } from '@/src/lib/email/templates/coffee-chat-request'
import { renderCoffeeChatResponseEmail } from '@/src/lib/email/templates/coffee-chat-response'
import { notifyCoffeeChatRequest, notifyCoffeeChatResponse } from '@/src/lib/notifications/create-notification'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://dailydraft.me'

export async function POST(req: NextRequest) {
  try {
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
              try { cookieStore.set(name, value, options as any) } catch { /* read-only in some contexts */ }
            })
          },
        },
      }
    )
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    // Rate limit
    const rateLimitResponse = applyRateLimit(user.id, getClientIp(req))
    if (rateLimitResponse) return rateLimitResponse

    if (!isEmailEnabled()) {
      return NextResponse.json({ success: false, error: 'Email not configured' }, { status: 503 })
    }

    const body = await req.json()
    const { type, chatId } = body as { type: 'request' | 'accepted' | 'declined'; chatId: string }

    if (!type || !chatId) {
      return NextResponse.json({ error: 'Missing type or chatId' }, { status: 400 })
    }

    // Fetch chat with related data
    const { data: chat, error: chatError } = await supabaseAdmin
      .from('coffee_chats')
      .select('*')
      .eq('id', chatId)
      .single()

    if (chatError || !chat) {
      return NextResponse.json({ error: '채팅을 찾을 수 없습니다' }, { status: 404 })
    }

    // 소유권 + 역할 검증: type별로 적절한 사용자만 트리거 가능
    const isRequester = chat.requester_user_id === user.id
    const isOwner = chat.owner_user_id === user.id
    if (!isRequester && !isOwner) {
      return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
    }
    // request는 요청자만, accepted/declined는 오너만 트리거 가능
    if (type === 'request' && !isRequester) {
      return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
    }
    if ((type === 'accepted' || type === 'declined') && !isOwner) {
      return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
    }

    // Fetch opportunity title
    const { data: opportunity } = await supabaseAdmin
      .from('opportunities')
      .select('title, creator_id')
      .eq('id', chat.opportunity_id)
      .single()

    const projectTitle = opportunity?.title || '프로젝트'

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
        return NextResponse.json({ success: false, error: 'Owner email not found' }, { status: 422 })
      }

      const html = renderCoffeeChatRequestEmail({
        ownerName,
        requesterName,
        requesterMessage: chat.message || '(메시지 없음)',
        projectTitle,
        appUrl: APP_URL,
      })

      await resend?.emails.send({
        from: FROM_EMAIL,
        to: ownerEmail,
        subject: `[Draft] ${requesterName}님이 커피챗을 신청했습니다`,
        html,
      })

      // In-app notification
      await notifyCoffeeChatRequest(chat.owner_user_id, requesterName, projectTitle)
    } else if (type === 'accepted' || type === 'declined') {
      if (!requesterEmail) {
        return NextResponse.json({ success: false, error: 'Requester email not found' }, { status: 422 })
      }

      const html = renderCoffeeChatResponseEmail({
        requesterName,
        ownerName,
        projectTitle,
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
      await notifyCoffeeChatResponse(
        chat.requester_user_id,
        ownerName,
        projectTitle,
        type === 'accepted'
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logApiError(error, req).catch(() => {})
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
