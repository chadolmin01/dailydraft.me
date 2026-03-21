import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getKSTDate } from '@/src/lib/utils'
import { ApiResponse } from '@/src/lib/api-utils'

export const runtime = 'nodejs'

interface RecommendedEvent {
  event_id: string
  title: string
  organizer: string
  event_type: string
  description: string
  registration_end_date: string
  registration_url: string | null
  interest_tags: string[]
  tag_score: number
  vector_score?: number
  context_boost: number
  total_score: number
  days_until_deadline: number
  match_reasons: string[]
}

interface EventFromDB {
  id: string
  title: string
  organizer: string
  event_type: string
  description?: string
  registration_end_date: string
  registration_url?: string | null
  interest_tags: string[]
  tag_score?: number
  vector_score?: number
  days_until_deadline?: number
}

interface MatchReasonInput {
  tag_score?: number
  interest_tags?: string[]
  vector_score?: number
  days_until_deadline?: number
  event_type?: string
}

/**
 * GET /api/events/recommend
 * 사용자 맞춤 이벤트 추천
 *
 * Query params:
 * - user_id: 사용자 ID (optional, 없으면 tags 필수)
 * - tags: 관심 태그 (comma separated, user_id 없을 때 사용)
 * - eventId: 현재 이벤트 ID (관련 이벤트 추천 시 사용, 해당 이벤트 제외)
 * - limit: 추천 개수 (default: 10)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const tagsParam = searchParams.get('tags')
    const eventId = searchParams.get('eventId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return ApiResponse.internalError('서버 설정 오류가 발생했습니다')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    let recommendations: RecommendedEvent[] = []

    if (userId) {
      // 로그인 사용자: 프로필 기반 추천
      const { data, error } = await supabase.rpc('recommend_events_for_user', {
        p_user_id: userId,
        p_limit: limit,
      })

      if (error) {
        throw error
      }

      recommendations = (data as EventFromDB[] || []).map((item) => ({
        event_id: item.id,
        title: item.title,
        organizer: item.organizer,
        event_type: item.event_type,
        description: item.description || '',
        registration_end_date: item.registration_end_date,
        registration_url: item.registration_url || null,
        interest_tags: item.interest_tags,
        tag_score: item.tag_score || 0,
        vector_score: item.vector_score,
        context_boost: 0,
        total_score: item.tag_score || 0,
        days_until_deadline: item.days_until_deadline || 0,
        match_reasons: generateMatchReasons(item),
      }))
    } else if (eventId && tagsParam) {
      // 관련 이벤트 추천: 태그 기반으로 유사 이벤트 찾기 (현재 이벤트 제외)
      const tags = tagsParam.split(',').map((t) => t.trim()).filter(t => t)
      const today = getKSTDate()

      let query = supabase
        .from('startup_events')
        .select('id, title, organizer, event_type, registration_end_date, interest_tags')
        .eq('status', 'active')
        .gte('registration_end_date', today)
        .neq('id', eventId)
        .order('registration_end_date', { ascending: true })
        .limit(20)

      if (tags.length > 0) {
        query = query.overlaps('interest_tags', tags)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      // 태그 유사도 점수 계산 후 정렬
      const scoredEvents = (data as EventFromDB[] || []).map((item) => {
        const matchingTags = item.interest_tags?.filter((t: string) => tags.includes(t)) || []
        const similarityScore = tags.length > 0 ? matchingTags.length / tags.length : 0

        return {
          id: item.id,
          title: item.title,
          organizer: item.organizer,
          event_type: item.event_type,
          registration_end_date: item.registration_end_date,
          interest_tags: item.interest_tags || [],
          similarity_score: similarityScore,
        }
      })

      // 유사도 높은 순 정렬
      scoredEvents.sort((a, b) => b.similarity_score - a.similarity_score)

      return ApiResponse.ok(scoredEvents.slice(0, limit))
    } else if (tagsParam) {
      // 비로그인: 태그 기반 추천
      const tags = tagsParam.split(',').map((t) => t.trim())

      const { data, error } = await supabase.rpc('recommend_events_by_tags', {
        p_tags: tags,
        p_limit: limit,
      })

      if (error) {
        throw error
      }

      recommendations = (data as EventFromDB[] || []).map((item) => ({
        event_id: item.id,
        title: item.title,
        organizer: item.organizer,
        event_type: item.event_type,
        description: item.description || '',
        registration_end_date: item.registration_end_date,
        registration_url: item.registration_url || null,
        interest_tags: item.interest_tags,
        tag_score: item.tag_score || 0,
        vector_score: item.vector_score,
        context_boost: 0,
        total_score: item.tag_score || 0,
        days_until_deadline: item.days_until_deadline || 0,
        match_reasons: generateMatchReasons(item),
      }))
    } else if (eventId) {
      // eventId만 있고 tags가 없는 경우: 최신 이벤트 반환 (현재 이벤트 제외)
      const today = getKSTDate()

      const { data, error } = await supabase
        .from('startup_events')
        .select('id, title, organizer, event_type, registration_end_date, interest_tags')
        .eq('status', 'active')
        .gte('registration_end_date', today)
        .neq('id', eventId)
        .order('registration_end_date', { ascending: true })
        .limit(limit)

      if (error) throw error

      return ApiResponse.ok(
        (data as EventFromDB[] || []).map((item) => ({
          id: item.id,
          title: item.title,
          organizer: item.organizer,
          event_type: item.event_type,
          registration_end_date: item.registration_end_date,
          interest_tags: item.interest_tags || [],
          similarity_score: 0,
        }))
      )
    } else {
      // 파라미터 없음: 마감 임박 이벤트 반환
      const { data, error } = await supabase
        .from('startup_events')
        .select('*')
        .eq('status', 'active')
        .gte('registration_end_date', getKSTDate())
        .order('registration_end_date', { ascending: true })
        .limit(limit)

      if (error) throw error

      recommendations = (data as EventFromDB[] || []).map((item) => ({
        event_id: item.id,
        title: item.title,
        organizer: item.organizer,
        event_type: item.event_type,
        description: item.description?.substring(0, 200) || '',
        registration_end_date: item.registration_end_date,
        registration_url: item.registration_url || null,
        interest_tags: item.interest_tags || [],
        tag_score: 0,
        context_boost: 0,
        total_score: 0,
        days_until_deadline: Math.ceil(
          (new Date(item.registration_end_date).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        ),
        match_reasons: ['마감 임박 이벤트'],
      }))
    }

    return ApiResponse.ok({
      success: true,
      count: recommendations.length,
      recommendations,
    })
  } catch (error) {
    console.error('Error getting event recommendations:', error)
    return ApiResponse.internalError('추천 이벤트를 불러올 수 없습니다')
  }
}

/**
 * 매칭 이유 생성
 */
function generateMatchReasons(item: MatchReasonInput): string[] {
  const reasons: string[] = []

  // 태그 매칭
  if (item.tag_score && item.tag_score > 0) {
    const matchedTags = item.interest_tags?.slice(0, 3).join(', ')
    if (matchedTags) {
      reasons.push(`관심사 일치: ${matchedTags}`)
    }
  }

  // 벡터 유사도
  if (item.vector_score && item.vector_score > 0.5) {
    const percent = Math.round(item.vector_score * 100)
    reasons.push(`프로필과 ${percent}% 유사`)
  }

  // 마감 임박
  if (item.days_until_deadline !== undefined) {
    if (item.days_until_deadline <= 3) {
      reasons.push(`D-${item.days_until_deadline} 마감 임박!`)
    } else if (item.days_until_deadline <= 7) {
      reasons.push(`D-${item.days_until_deadline} 마감`)
    }
  }

  // 이벤트 타입
  if (item.event_type) {
    reasons.push(`${item.event_type} 프로그램`)
  }

  return reasons.length > 0 ? reasons : ['추천 이벤트']
}
