import { createClient } from '@supabase/supabase-js'
import { resend, FROM_EMAIL, isEmailEnabled } from './client'
import { renderDeadlineNotificationEmail } from './templates/deadline-notification'

interface UserWithDeadlineEvents {
  userId: string
  email: string
  nickname: string
  emailDeadlineDays: number
  events: Array<{
    id: string
    title: string
    organizer: string
    daysLeft: number
    registrationUrl: string | null
  }>
}

interface NotificationSettings {
  user_id: string
  email_enabled: boolean
  email_deadline_days: number
}

/**
 * 마감 임박 이메일 알림 발송
 * - 북마크한 이벤트 중 3일 이내 마감인 이벤트
 * - 사용자별로 묶어서 한 번에 발송
 */
export async function sendDeadlineNotificationEmails(): Promise<{
  success: boolean
  emailsSent: number
  errors: string[]
}> {
  const errors: string[] = []
  let emailsSent = 0

  // 이메일 비활성화 상태 확인
  if (!isEmailEnabled()) {
    return { success: true, emailsSent: 0, errors: [] }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dailydraft.me'

  if (!supabaseUrl || !supabaseKey) {
    return {
      success: false,
      emailsSent: 0,
      errors: ['Supabase configuration missing'],
    }
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    // 1. 이메일 알림이 활성화된 사용자의 설정 조회
    const { data: settingsData } = await supabase
      .from('notification_settings')
      .select('user_id, email_enabled, email_deadline_days')
      .eq('email_enabled', true)

    // 설정이 있는 사용자 맵 (기본값: email_enabled=true, email_deadline_days=3)
    const userSettingsMap = new Map<string, NotificationSettings>()
    if (settingsData) {
      for (const setting of settingsData as NotificationSettings[]) {
        userSettingsMap.set(setting.user_id, setting)
      }
    }

    // 2. 7일 이내 마감 이벤트를 북마크한 사용자 목록 조회 (최대 범위)
    const sevenDaysLater = new Date()
    sevenDaysLater.setDate(today.getDate() + 7)
    const sevenDaysStr = sevenDaysLater.toISOString().split('T')[0]

    // 북마크 + 이벤트 + 프로필 조인 쿼리
    const { data: bookmarksData, error: bookmarksError } = await supabase
      .from('event_bookmarks')
      .select(`
        user_id,
        event_id,
        startup_events!inner (
          id,
          title,
          organizer,
          registration_end_date,
          registration_url,
          status
        ),
        profiles!inner (
          user_id,
          nickname,
          contact_email
        )
      `)
      .gte('startup_events.registration_end_date', todayStr)
      .lte('startup_events.registration_end_date', sevenDaysStr)
      .eq('startup_events.status', 'active')

    if (bookmarksError) {
      return {
        success: false,
        emailsSent: 0,
        errors: [bookmarksError.message],
      }
    }

    if (!bookmarksData || bookmarksData.length === 0) {
      return { success: true, emailsSent: 0, errors: [] }
    }

    // 3. 오늘 이미 이메일을 보낸 사용자 확인 (중복 방지)
    const { data: sentToday } = await supabase
      .from('email_logs')
      .select('user_id')
      .eq('email_type', 'deadline_notification')
      .gte('sent_at', todayStr)

    const sentTodayUserIds = new Set(
      (sentToday as { user_id: string }[] | null)?.map(s => s.user_id) || []
    )

    // 4. 사용자별로 이벤트 그룹화 (설정에 따라 필터링)
    const userEventsMap = new Map<string, UserWithDeadlineEvents>()

    interface BookmarkWithJoins {
      user_id: string
      event_id: string
      startup_events: {
        id: string
        title: string
        organizer: string
        registration_end_date: string
        registration_url: string | null
        status: string | null
      }
      profiles: {
        user_id: string
        nickname: string
        contact_email: string | null
      }
    }

    for (const bookmark of bookmarksData as unknown as BookmarkWithJoins[]) {
      const userId = bookmark.user_id
      const profile = bookmark.profiles
      const event = bookmark.startup_events

      // 이미 오늘 이메일 보낸 사용자 스킵
      if (sentTodayUserIds.has(userId)) continue

      // 이메일 주소 없으면 스킵
      if (!profile?.contact_email) continue

      // 사용자 알림 설정 확인 (기본값: email_enabled=true, email_deadline_days=3)
      const userSettings = userSettingsMap.get(userId)
      const emailEnabled = userSettings?.email_enabled ?? true
      const emailDeadlineDays = userSettings?.email_deadline_days ?? 3

      // 이메일 비활성화한 사용자 스킵
      if (!emailEnabled) continue

      const daysLeft = Math.ceil(
        (new Date(event.registration_end_date).getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24)
      )

      // 사용자가 설정한 일수 이내의 이벤트만 포함
      if (daysLeft > emailDeadlineDays) continue

      if (!userEventsMap.has(userId)) {
        userEventsMap.set(userId, {
          userId,
          email: profile.contact_email,
          nickname: profile.nickname || '회원',
          emailDeadlineDays,
          events: [],
        })
      }

      userEventsMap.get(userId)!.events.push({
        id: event.id,
        title: event.title,
        organizer: event.organizer,
        daysLeft,
        registrationUrl: event.registration_url,
      })
    }

    // 4. 각 사용자에게 이메일 발송
    for (const [userId, userData] of userEventsMap) {
      try {
        // 마감일 임박 순으로 정렬
        userData.events.sort((a, b) => a.daysLeft - b.daysLeft)

        const html = renderDeadlineNotificationEmail({
          userName: userData.nickname,
          events: userData.events,
          appUrl,
        })

        const { error: sendError } = await resend!.emails.send({
          from: FROM_EMAIL,
          to: userData.email,
          subject: `[DailyDraft] ${userData.events.length}개 프로그램 마감 임박!`,
          html,
        })

        if (sendError) {
          errors.push(`${userData.email}: ${sendError.message}`)
          continue
        }

        // 이메일 발송 로그 기록
        await supabase.from('email_logs').insert({
          user_id: userId,
          email_type: 'deadline_notification',
          recipient_email: userData.email,
          event_count: userData.events.length,
          sent_at: new Date().toISOString(),
        })

        emailsSent++

        // Rate limiting: 100ms 대기
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err)
        errors.push(`${userData.email}: ${errMsg}`)
      }
    }

    return {
      success: errors.length === 0,
      emailsSent,
      errors,
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      emailsSent,
      errors: [errMsg],
    }
  }
}
