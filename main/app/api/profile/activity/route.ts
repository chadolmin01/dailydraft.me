import { createClient } from '@/src/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ApiResponse } from '@/src/lib/api-utils'

interface Activity {
  id: string
  type: 'application_sent' | 'application_received' | 'application_accepted' | 'application_rejected' | 'connection'
  title: string
  subtitle?: string
  timestamp: string
  href?: string
}

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    const activities: Activity[] = []

    // 1. 보낸 지원서 (최근 10개)
    const { data: sentApps } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        created_at,
        updated_at,
        opportunities (
          id,
          title
        )
      `)
      .eq('applicant_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    interface ApplicationData {
      id: string
      status: string
      created_at: string
      updated_at: string
      opportunities: { id: string; title: string } | null
    }

    const sentApplications = sentApps as ApplicationData[] | null

    sentApplications?.forEach((app) => {
      if (app.opportunities) {
        // 지원 완료
        activities.push({
          id: `sent-${app.id}`,
          type: 'application_sent',
          title: app.opportunities.title,
          timestamp: app.created_at,
          href: `/opportunities/${app.opportunities.id}`,
        })

        // 수락/거절된 경우 추가
        if (app.status === 'accepted') {
          activities.push({
            id: `accepted-${app.id}`,
            type: 'application_accepted',
            title: app.opportunities.title,
            subtitle: '연락처를 확인할 수 있습니다',
            timestamp: app.updated_at,
            href: '/connections',
          })
        } else if (app.status === 'rejected') {
          activities.push({
            id: `rejected-${app.id}`,
            type: 'application_rejected',
            title: app.opportunities.title,
            timestamp: app.updated_at,
          })
        }
      }
    })

    // 2. 받은 지원서 (내 Opportunity에 대한)
    const { data: myOpps } = await supabase
      .from('opportunities')
      .select('id')
      .eq('creator_id', user.id)

    const oppIds = (myOpps as { id: string }[] | null)?.map((o) => o.id) || []

    if (oppIds.length > 0) {
      const { data: receivedApps } = await supabase
        .from('applications')
        .select(`
          id,
          created_at,
          opportunities (
            id,
            title
          ),
          profiles!applications_applicant_id_fkey (
            nickname
          )
        `)
        .in('opportunity_id', oppIds)
        .order('created_at', { ascending: false })
        .limit(10)

      interface ReceivedAppData {
        id: string
        created_at: string
        opportunities: { id: string; title: string } | null
        profiles: { nickname: string } | null
      }

      const receivedApplications = receivedApps as ReceivedAppData[] | null

      receivedApplications?.forEach((app) => {
        if (app.opportunities) {
          activities.push({
            id: `received-${app.id}`,
            type: 'application_received',
            title: `${app.profiles?.nickname || '누군가'}님이 지원했습니다`,
            subtitle: app.opportunities.title,
            timestamp: app.created_at,
            href: '/applications?tab=received',
          })
        }
      })
    }

    // 3. 연결 (accepted_connections)
    const { data: connections } = await supabase
      .from('accepted_connections')
      .select(`
        id,
        connected_at,
        applications (
          opportunities (
            title
          )
        )
      `)
      .or(`opportunity_creator_id.eq.${user.id},applicant_id.eq.${user.id}`)
      .order('connected_at', { ascending: false })
      .limit(5)

    interface ConnectionData {
      id: string
      connected_at: string
      applications: {
        opportunities: { title: string } | null
      } | null
    }

    const connectionData = connections as ConnectionData[] | null

    connectionData?.forEach((conn) => {
      activities.push({
        id: `conn-${conn.id}`,
        type: 'connection',
        title: conn.applications?.opportunities?.title || '새로운 연결',
        subtitle: '연락처가 공유되었습니다',
        timestamp: conn.connected_at,
        href: '/connections',
      })
    })

    // 시간순 정렬 (최신순)
    activities.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    return NextResponse.json(activities.slice(0, 10))
  } catch (_error) {
    return ApiResponse.internalError()
  }
}
