import { createClient } from '@/src/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params
    const supabase = await createClient()

    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    // 태그 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const tagsParam = searchParams.get('tags') || ''
    const eventTags = tagsParam.split(',').filter(Boolean)
    const limit = parseInt(searchParams.get('limit') || '4')

    if (eventTags.length === 0) {
      return NextResponse.json({ opportunities: [] })
    }

    // 사용자 프로필 가져오기 (매칭 점수 계산용)
    const { data: profileData } = await supabase
      .from('profiles')
      .select('interest_tags, skills')
      .eq('user_id', user.id)
      .single()

    const userTags = (profileData as { interest_tags: string[] } | null)?.interest_tags || []

    // 이벤트 태그와 관련된 Opportunities 찾기
    const { data: opportunities, error } = await supabase
      .from('opportunities')
      .select(`
        id,
        title,
        type,
        description,
        needed_roles,
        interest_tags,
        location_type,
        creator_id,
        profiles!opportunities_creator_id_fkey (
          nickname
        )
      `)
      .eq('status', 'active')
      .neq('creator_id', user.id) // 본인이 만든 건 제외
      .overlaps('interest_tags', eventTags) // 이벤트 태그와 겹치는 것
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // 매칭 점수 계산 및 정렬
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scoredOpportunities = (opportunities || []).map((opp: any) => {
      const oppTags = opp.interest_tags || []

      // 이벤트 태그와 매칭되는 태그
      const matchingEventTags = oppTags.filter((t: string) => eventTags.includes(t))

      // 사용자 관심사와 매칭되는 태그
      const matchingUserTags = oppTags.filter((t: string) => userTags.includes(t))

      // 통합 매칭 점수 (이벤트 태그 50% + 사용자 태그 50%)
      const eventMatchRatio = eventTags.length > 0
        ? matchingEventTags.length / eventTags.length
        : 0
      const userMatchRatio = userTags.length > 0
        ? matchingUserTags.length / userTags.length
        : 0

      const matchScore = Math.round(
        (eventMatchRatio * 50) + (userMatchRatio * 50)
      )

      return {
        id: opp.id,
        title: opp.title,
        type: opp.type,
        description: opp.description,
        needed_roles: opp.needed_roles || [],
        interest_tags: oppTags,
        location_type: opp.location_type,
        creator_nickname: opp.profiles?.nickname || '익명',
        match_score: matchScore,
        matching_tags: [...new Set([...matchingEventTags, ...matchingUserTags])],
      }
    })

    // 매칭 점수 순으로 정렬
    scoredOpportunities.sort((a, b) => b.match_score - a.match_score)

    return NextResponse.json({
      opportunities: scoredOpportunities.slice(0, limit),
      event_id: eventId,
      total_found: scoredOpportunities.length,
    })
  } catch (_error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
