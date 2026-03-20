import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'

export interface NotificationItem {
  id: string
  type: 'new_application' | 'application_accepted' | 'application_rejected' | 'new_match' | 'deadline' | 'connection'
  title: string
  message: string
  link?: string
  createdAt: string
  read: boolean
}

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    const notifications: NotificationItem[] = []

    // 1. 새 지원서 도착 (내 기회에)
    const { data: myOpportunities } = await supabase
      .from('opportunities')
      .select('id, title')
      .eq('creator_id', user.id)

    if (myOpportunities && myOpportunities.length > 0) {
      const opportunityIds = myOpportunities.map(o => o.id)

      const { data: newApplications } = await supabase
        .from('applications')
        .select('id, created_at, opportunity_id, applicant_id')
        .in('opportunity_id', opportunityIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5)

      if (newApplications && newApplications.length > 0) {
        // 지원자 프로필 별도 조회
        const applicantIds = newApplications.map(app => app.applicant_id)
        const { data: applicantProfiles } = await supabase
          .from('profiles')
          .select('user_id, nickname')
          .in('user_id', applicantIds)

        const profileMap = new Map(
          (applicantProfiles || []).map(p => [p.user_id, p.nickname])
        )

        for (const app of newApplications) {
          const opp = myOpportunities.find(o => o.id === app.opportunity_id)
          const nickname = profileMap.get(app.applicant_id) || '익명'
          notifications.push({
            id: `app-${app.id}`,
            type: 'new_application',
            title: '새 지원서 도착',
            message: `${nickname}님이 "${opp?.title || '기회'}"에 지원했습니다`,
            link: `/applications?tab=received`,
            createdAt: app.created_at || new Date().toISOString(),
            read: false,
          })
        }
      }
    }

    // 2. 지원 결과 (수락/거절)
    const { data: myApplicationResults } = await supabase
      .from('applications')
      .select('id, status, updated_at, opportunity_id')
      .eq('applicant_id', user.id)
      .in('status', ['accepted', 'rejected'])
      .order('updated_at', { ascending: false })
      .limit(5)

    if (myApplicationResults && myApplicationResults.length > 0) {
      // 기회 정보 별도 조회
      const oppIds = myApplicationResults.map(app => app.opportunity_id)
      const { data: opportunities } = await supabase
        .from('opportunities')
        .select('id, title')
        .in('id', oppIds)

      const oppMap = new Map(
        (opportunities || []).map(o => [o.id, o.title])
      )

      for (const app of myApplicationResults) {
        const oppTitle = oppMap.get(app.opportunity_id) || '기회'
        notifications.push({
          id: `result-${app.id}`,
          type: app.status === 'accepted' ? 'application_accepted' : 'application_rejected',
          title: app.status === 'accepted' ? '지원 수락됨' : '지원 결과',
          message: app.status === 'accepted'
            ? `"${oppTitle}" 지원이 수락되었습니다!`
            : `"${oppTitle}" 지원이 검토 완료되었습니다`,
          link: `/applications?tab=sent`,
          createdAt: app.updated_at || new Date().toISOString(),
          read: false,
        })
      }
    }

    // 3. 연결 완료
    const { data: connections } = await supabase
      .from('accepted_connections')
      .select('id, connected_at, opportunity_creator_id, applicant_id')
      .or(`opportunity_creator_id.eq.${user.id},applicant_id.eq.${user.id}`)
      .order('connected_at', { ascending: false })
      .limit(3)

    if (connections && connections.length > 0) {
      // 상대방 ID 수집
      const otherUserIds = connections.map(conn =>
        conn.opportunity_creator_id === user.id ? conn.applicant_id : conn.opportunity_creator_id
      )

      const { data: otherProfiles } = await supabase
        .from('profiles')
        .select('user_id, nickname')
        .in('user_id', otherUserIds)

      const profileMap = new Map(
        (otherProfiles || []).map(p => [p.user_id, p.nickname])
      )

      for (const conn of connections) {
        const otherId = conn.opportunity_creator_id === user.id
          ? conn.applicant_id
          : conn.opportunity_creator_id
        const otherNickname = profileMap.get(otherId) || '팀원'

        notifications.push({
          id: `conn-${conn.id}`,
          type: 'connection',
          title: '연결 완료',
          message: `${otherNickname}님과 연결되었습니다`,
          link: '/connections',
          createdAt: conn.connected_at || new Date().toISOString(),
          read: false,
        })
      }
    }

    // 4. 마감 임박 이벤트 (3일 이내)
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const threeDaysLater = new Date()
    threeDaysLater.setDate(threeDaysLater.getDate() + 3)
    const threeDaysStr = threeDaysLater.toISOString().split('T')[0]

    const { data: upcomingDeadlines } = await supabase
      .from('startup_events')
      .select('id, title, registration_end_date, registration_url')
      .gte('registration_end_date', todayStr)
      .lte('registration_end_date', threeDaysStr)
      .eq('status', 'active')
      .order('registration_end_date', { ascending: true })
      .limit(3)

    if (upcomingDeadlines) {
      for (const event of upcomingDeadlines) {
        const deadlineDate = new Date(event.registration_end_date)
        const daysLeft = Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        notifications.push({
          id: `deadline-${event.id}`,
          type: 'deadline',
          title: '마감 임박',
          message: `"${event.title}" ${daysLeft <= 0 ? '오늘' : `${daysLeft}일 후`} 마감`,
          link: event.registration_url || `/events/${event.id}`,
          createdAt: new Date().toISOString(),
          read: false,
        })
      }
    }

    // 시간순 정렬
    notifications.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return ApiResponse.ok(notifications.slice(0, 10))
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return ApiResponse.internalError('알림 피드를 불러올 수 없습니다')
  }
}
