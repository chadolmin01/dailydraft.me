import { NextRequest } from 'next/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { resend, FROM_EMAIL, isEmailEnabled } from '@/src/lib/email/client'
import { renderCoffeeChatReminderEmail } from '@/src/lib/email/templates/coffee-chat-reminder'
import { createClient } from '@supabase/supabase-js'
import { withCronCapture } from '@/src/lib/posthog/with-cron-capture'
import { APP_URL } from '@/src/constants'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Cron: send reminders for pending coffee chats older than 48 hours
export const GET = withCronCapture('coffee-chat-reminders', async (req: NextRequest) => {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return ApiResponse.unauthorized()
  }

  if (!isEmailEnabled()) {
    return ApiResponse.serviceUnavailable('Email not configured')
  }

  const supabaseAdmin = getAdminClient()
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

  const { data: pendingChats, error } = await supabaseAdmin
    .from('coffee_chats')
    .select('*')
    .eq('status', 'pending')
    .lt('created_at', fortyEightHoursAgo)
    .lt('updated_at', fortyEightHoursAgo)

  if (error) {
    throw new Error(`Failed to fetch pending chats: ${error.message}`)
  }

  if (!pendingChats || pendingChats.length === 0) {
    return ApiResponse.ok({ success: true, sentCount: 0 })
  }

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
    // Inner try/catch: per-chat failure shouldn't halt batch
    try {
      const ownerProfile = profileMap.get(chat.owner_user_id)
      let ownerEmail = ownerProfile?.contact_email

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

      await supabaseAdmin
        .from('coffee_chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chat.id)

      sentCount++
    } catch (err) {
      console.error(`Failed to send reminder for chat ${chat.id}:`, err)
    }
  }

  return ApiResponse.ok({ success: true, sentCount })
})
