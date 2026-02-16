import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

interface ApplicationWithOpportunity {
  id: string
  status: string
  created_at: string
  opportunities: { title: string } | { title: string }[] | null
}

interface BookmarkWithEvent {
  id: string
  created_at: string
  startup_events: { title: string } | { title: string }[] | null
}

interface ConnectionWithApplication {
  id: string
  connected_at: string
  applications: { opportunities: { title: string } | { title: string }[] | null } | { opportunities: { title: string } | { title: string }[] | null }[] | null
}

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 병렬로 모든 통계 가져오기
    const [
      bookmarksResult,
      sentApplicationsResult,
      myOpportunitiesResult,
      connectionsResult,
      recentActivityResult,
    ] = await Promise.all([
      // 북마크 수
      supabase
        .from('event_bookmarks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),

      // 보낸 지원 수
      supabase
        .from('applications')
        .select('id, status', { count: 'exact' })
        .eq('applicant_id', user.id),

      // 내 Opportunity들 (받은 지원 계산용)
      supabase
        .from('opportunities')
        .select('id')
        .eq('creator_id', user.id),

      // 연결 수
      supabase
        .from('accepted_connections')
        .select('id', { count: 'exact', head: true })
        .or(`opportunity_creator_id.eq.${user.id},applicant_id.eq.${user.id}`),

      // 최근 활동 (지원, 북마크, 연결)
      getRecentActivity(supabase, user.id),
    ])

    // 받은 지원 수 계산
    const myOpportunityIds = (myOpportunitiesResult.data as { id: string }[] | null)?.map(o => o.id) || []
    let receivedApplications = { total: 0, pending: 0, accepted: 0, rejected: 0 }

    if (myOpportunityIds.length > 0) {
      const { data: receivedApps } = await supabase
        .from('applications')
        .select('id, status')
        .in('opportunity_id', myOpportunityIds)

      const apps = receivedApps as { id: string; status: string }[] | null || []
      receivedApplications = {
        total: apps.length,
        pending: apps.filter(a => a.status === 'pending').length,
        accepted: apps.filter(a => a.status === 'accepted').length,
        rejected: apps.filter(a => a.status === 'rejected').length,
      }
    }

    // 보낸 지원 통계
    const sentApps = sentApplicationsResult.data as { id: string; status: string }[] | null || []
    const sentApplications = {
      total: sentApps.length,
      pending: sentApps.filter(a => a.status === 'pending').length,
      accepted: sentApps.filter(a => a.status === 'accepted').length,
      rejected: sentApps.filter(a => a.status === 'rejected').length,
    }

    return NextResponse.json({
      bookmarks: bookmarksResult.count || 0,
      sentApplications,
      receivedApplications,
      opportunities: myOpportunityIds.length,
      connections: connectionsResult.count || 0,
      recentActivity: recentActivityResult,
    })

  } catch (_error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function getRecentActivity(supabase: SupabaseClient, userId: string) {
  const activities: Array<{
    type: 'application_sent' | 'application_received' | 'application_accepted' | 'bookmark' | 'connection'
    title: string
    description: string
    created_at: string
  }> = []

  // 최근 보낸 지원
  const { data: sentApps } = await supabase
    .from('applications')
    .select(`
      id,
      status,
      created_at,
      opportunities (title)
    `)
    .eq('applicant_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (sentApps) {
    for (const app of sentApps as ApplicationWithOpportunity[]) {
      const opportunity = Array.isArray(app.opportunities) ? app.opportunities[0] : app.opportunities
      const opportunityTitle = opportunity?.title || '알 수 없음'
      if (app.status === 'accepted') {
        activities.push({
          type: 'application_accepted',
          title: '지원 수락됨',
          description: `"${opportunityTitle}" 지원이 수락되었습니다`,
          created_at: app.created_at,
        })
      } else {
        activities.push({
          type: 'application_sent',
          title: '지원서 전송',
          description: `"${opportunityTitle}"에 지원했습니다`,
          created_at: app.created_at,
        })
      }
    }
  }

  // 최근 북마크
  const { data: bookmarks } = await supabase
    .from('event_bookmarks')
    .select(`
      id,
      created_at,
      startup_events (title)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(3)

  if (bookmarks) {
    for (const bookmark of bookmarks as BookmarkWithEvent[]) {
      const event = Array.isArray(bookmark.startup_events) ? bookmark.startup_events[0] : bookmark.startup_events
      activities.push({
        type: 'bookmark',
        title: '프로그램 저장',
        description: `"${event?.title || '알 수 없음'}"을 저장했습니다`,
        created_at: bookmark.created_at,
      })
    }
  }

  // 최근 연결
  const { data: connections } = await supabase
    .from('accepted_connections')
    .select(`
      id,
      connected_at,
      applications (
        opportunities (title)
      )
    `)
    .or(`opportunity_creator_id.eq.${userId},applicant_id.eq.${userId}`)
    .order('connected_at', { ascending: false })
    .limit(3)

  if (connections) {
    for (const conn of connections as ConnectionWithApplication[]) {
      const application = Array.isArray(conn.applications) ? conn.applications[0] : conn.applications
      const opportunity = application ? (Array.isArray(application.opportunities) ? application.opportunities[0] : application.opportunities) : null
      activities.push({
        type: 'connection',
        title: '새 연결',
        description: `"${opportunity?.title || '알 수 없음'}"에서 연결되었습니다`,
        created_at: conn.connected_at,
      })
    }
  }

  // 시간순 정렬
  activities.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return activities.slice(0, 10)
}
