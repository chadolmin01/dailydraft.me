import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'

interface CalendarEvent {
  id: string
  title: string
  organizer: string
  event_type: string
  registration_end_date: string
  registration_url: string | null
  interest_tags: string[]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return ApiResponse.unauthorized()
    }

    // 해당 월의 시작일과 종료일
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`

    // 사용자 프로필 및 북마크 가져오기
    const [profileResult, bookmarksResult, eventsResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('interest_tags')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('event_bookmarks')
        .select('event_id')
        .eq('user_id', user.id),
      supabase
        .from('startup_events')
        .select('id, title, organizer, event_type, registration_end_date, registration_url, interest_tags')
        .eq('status', 'active')
        .gte('registration_end_date', startDate)
        .lte('registration_end_date', endDate)
        .order('registration_end_date', { ascending: true }),
    ])

    const profile = profileResult.data as { interest_tags: string[] } | null
    const userTags = profile?.interest_tags || []

    const bookmarkedIds = new Set(
      (bookmarksResult.data as { event_id: string }[] | null)?.map(b => b.event_id) || []
    )

    const events = (eventsResult.data as CalendarEvent[] || []).map((event) => {
      const matchingTags = event.interest_tags?.filter((t: string) => userTags.includes(t)) || []
      const matchScore = userTags.length > 0
        ? Math.round((matchingTags.length / userTags.length) * 100)
        : 0

      return {
        id: event.id,
        title: event.title,
        organizer: event.organizer,
        event_type: event.event_type,
        registration_end_date: event.registration_end_date,
        registration_url: event.registration_url,
        interest_tags: event.interest_tags || [],
        is_bookmarked: bookmarkedIds.has(event.id),
        match_score: matchScore,
      }
    })

    return NextResponse.json({
      events,
      userTags,
      year,
      month,
    })

  } catch (_error) {
    return ApiResponse.internalError()
  }
}
