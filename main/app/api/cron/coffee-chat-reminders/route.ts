import { NextRequest, NextResponse } from 'next/server'
import { resend, FROM_EMAIL, isEmailEnabled } from '@/src/lib/email/client'
import { renderCoffeeChatReminderEmail } from '@/src/lib/email/templates/coffee-chat-reminder'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://dailydraft.me'

// Cron: send reminders for pending coffee chats older than 48 hours
export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isEmailEnabled()) {
    return NextResponse.json({ success: false, error: 'Email not configured' })
  }

  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    // Find pending chats older than 48 hours
    const { data: pendingChats, error } = await supabaseAdmin
      .from('coffee_chats')
      .select('*')
      .eq('status', 'pending')
      .lt('created_at', fortyEightHoursAgo)

    if (error) {
      console.error('Failed to fetch pending chats:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    let sentCount = 0

    for (const chat of pendingChats || []) {
      try {
        // Fetch opportunity
        const { data: opportunity } = await supabaseAdmin
          .from('opportunities')
          .select('title')
          .eq('id', chat.opportunity_id)
          .single()

        // Fetch owner profile and email
        const { data: ownerProfile } = await supabaseAdmin
          .from('profiles')
          .select('nickname, contact_email')
          .eq('user_id', chat.owner_user_id)
          .single()

        const { data: ownerAuth } = await supabaseAdmin.auth.admin.getUserById(chat.owner_user_id)
        const ownerEmail = ownerProfile?.contact_email || ownerAuth?.user?.email

        if (!ownerEmail) continue

        const html = renderCoffeeChatReminderEmail({
          ownerName: ownerProfile?.nickname || 'User',
          requesterName: chat.requester_name || chat.requester_email?.split('@')[0] || 'User',
          projectTitle: opportunity?.title || '프로젝트',
          requestedAt: chat.created_at,
          appUrl: APP_URL,
        })

        await resend!.emails.send({
          from: FROM_EMAIL,
          to: ownerEmail,
          subject: `[Draft] 커피챗 요청이 대기 중입니다 - 응답해주세요`,
          html,
        })

        sentCount++
      } catch (err) {
        console.error(`Failed to send reminder for chat ${chat.id}:`, err)
      }
    }

    return NextResponse.json({ success: true, sentCount })
  } catch (error) {
    console.error('Cron coffee chat reminders error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
