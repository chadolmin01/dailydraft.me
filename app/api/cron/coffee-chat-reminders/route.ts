import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/src/lib/error-logging'
import { resend, FROM_EMAIL, isEmailEnabled } from '@/src/lib/email/client'
import { renderCoffeeChatReminderEmail } from '@/src/lib/email/templates/coffee-chat-reminder'
import { createClient } from '@supabase/supabase-js'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://dailydraft.me'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Cron: send reminders for pending coffee chats older than 48 hours
export async function GET(req: NextRequest) {
  // Verify cron secret (null-safe: reject if CRON_SECRET is unset)
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  if (!isEmailEnabled()) {
    return NextResponse.json({ success: false, error: 'Email not configured' })
  }

  try {
    const supabaseAdmin = getAdminClient()
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    // Find pending chats older than 48 hours that haven't been reminded yet
    // updated_at is used as reminder tracker: only select chats where updated_at < 48h ago
    // (after sending reminder, we touch updated_at to prevent re-sending)
    const { data: pendingChats, error } = await supabaseAdmin
      .from('coffee_chats')
      .select('*')
      .eq('status', 'pending')
      .lt('created_at', fortyEightHoursAgo)
      .lt('updated_at', fortyEightHoursAgo)

    if (error) {
      console.error('Failed to fetch pending chats:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!pendingChats || pendingChats.length === 0) {
      return NextResponse.json({ success: true, sentCount: 0 })
    }

    // Batch fetch opportunities and profiles to avoid N+1
    const opportunityIds = [...new Set(pendingChats.map(c => c.opportunity_id))]
    const ownerUserIds = [...new Set(pendingChats.map(c => c.owner_user_id))]

    const { data: opportunities = [] } = await supabaseAdmin
      .from('opportunities')
      .select('id, title')
      .in('id', opportunityIds)

    const { data: ownerProfiles = [] } = await supabaseAdmin
      .from('profiles')
      .select('user_id, nickname, contact_email')
      .in('user_id', ownerUserIds)

    const oppMap = new Map((opportunities ?? []).map(o => [o.id, o.title]))
    const profileMap = new Map((ownerProfiles ?? []).map(p => [p.user_id, p]))

    let sentCount = 0

    for (const chat of pendingChats) {
      try {
        const ownerProfile = profileMap.get(chat.owner_user_id)
        let ownerEmail = ownerProfile?.contact_email

        // Fallback: fetch auth email only if profile has no contact_email
        if (!ownerEmail) {
          const { data: ownerAuth } = await supabaseAdmin.auth.admin.getUserById(chat.owner_user_id)
          ownerEmail = ownerAuth?.user?.email
        }

        if (!ownerEmail) continue

        const html = renderCoffeeChatReminderEmail({
          ownerName: ownerProfile?.nickname || 'User',
          requesterName: chat.requester_name || chat.requester_email?.split('@')[0] || 'User',
          projectTitle: oppMap.get(chat.opportunity_id) || '프로젝트',
          requestedAt: chat.created_at,
          appUrl: APP_URL,
        })

        await resend?.emails.send({
          from: FROM_EMAIL,
          to: ownerEmail,
          subject: `[Draft] 커피챗 요청이 대기 중입니다 - 응답해주세요`,
          html,
        })

        // Touch updated_at to prevent duplicate reminders on next cron run
        await supabaseAdmin
          .from('coffee_chats')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', chat.id)

        sentCount++
      } catch (err) {
        console.error(`Failed to send reminder for chat ${chat.id}:`, err)
      }
    }

    return NextResponse.json({ success: true, sentCount })
  } catch (error) {
    logError({
      source: 'cron',
      message: error instanceof Error ? error.message : String(error),
      stackTrace: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/cron/coffee-chat-reminders',
      method: 'GET',
    }).catch(() => {})
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
