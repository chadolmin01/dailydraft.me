import { createClient } from '@/src/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { ApiResponse } from '@/src/lib/api-utils'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.app_metadata?.is_admin !== true) {
      return ApiResponse.unauthorized()
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const sort = searchParams.get('sort') || 'recent'
    const offset = (page - 1) * limit

    const admin = getAdminClient()

    let query = admin
      .from('opportunities')
      .select('id, title, type, status, creator_id, views_count, applications_count, created_at, updated_at', { count: 'exact' })

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (sort === 'views') {
      query = query.order('views_count', { ascending: false })
    } else if (sort === 'applications') {
      query = query.order('applications_count', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    query = query.range(offset, offset + limit - 1)

    const { data, count, error } = await query

    if (error) {
      return ApiResponse.internalError('Opportunity 조회 중 오류가 발생했습니다')
    }

    // Get creator nicknames
    const creatorIds = [...new Set((data || []).map(o => o.creator_id).filter(Boolean))]
    let creatorMap: Record<string, string> = {}

    if (creatorIds.length > 0) {
      const { data: profiles } = await admin
        .from('profiles')
        .select('user_id, nickname')
        .in('user_id', creatorIds)

      creatorMap = (profiles || []).reduce((acc: Record<string, string>, p: any) => {
        acc[p.user_id] = p.nickname
        return acc
      }, {})
    }

    const enriched = (data || []).map(o => ({
      ...o,
      creator_nickname: creatorMap[o.creator_id] || '알 수 없음',
    }))

    return ApiResponse.ok({
      opportunities: enriched,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch {
    return ApiResponse.internalError('Opportunity 조회 중 오류가 발생했습니다')
  }
}
