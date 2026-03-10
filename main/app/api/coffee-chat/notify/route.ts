import { NextRequest, NextResponse } from 'next/server'
import { resend, FROM_EMAIL, isEmailEnabled } from '@/src/lib/email/client'
import { renderCoffeeChatRequestEmail } from '@/src/lib/email/templates/coffee-chat-request'
import { renderCoffeeChatResponseEmail } from '@/src/lib/email/templates/coffee-chat-response'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://dailydraft.me'

export async function POST(req: NextRequest) {
  try {
    if (!isEmailEnabled()) {
      return NextResponse.json({ success: false, error: 'Email not configured' }, { status: 200 })
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
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
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
        return NextResponse.json({ success: false, error: 'Owner email not found' })
      }

      const html = renderCoffeeChatRequestEmail({
        ownerName,
        requesterName,
        requesterMessage: chat.message || '(메시지 없음)',
        projectTitle,
        appUrl: APP_URL,
      })

      await resend!.emails.send({
        from: FROM_EMAIL,
        to: ownerEmail,
        subject: `[Draft] ${requesterName}님이 커피챗을 신청했습니다`,
        html,
      })
    } else if (type === 'accepted' || type === 'declined') {
      if (!requesterEmail) {
        return NextResponse.json({ success: false, error: 'Requester email not found' })
      }

      const html = renderCoffeeChatResponseEmail({
        requesterName,
        ownerName,
        projectTitle,
        accepted: type === 'accepted',
        contactInfo: type === 'accepted' ? chat.contact_info : undefined,
        appUrl: APP_URL,
      })

      await resend!.emails.send({
        from: FROM_EMAIL,
        to: requesterEmail,
        subject: `[Draft] 커피챗이 ${type === 'accepted' ? '수락' : '거절'}되었습니다`,
        html,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Coffee chat notify error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
