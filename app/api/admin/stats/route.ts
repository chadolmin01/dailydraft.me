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

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.app_metadata?.is_admin !== true) {
      return ApiResponse.unauthorized()
    }

    const admin = getAdminClient()

    const [
      { count: totalUsers },
      { count: totalOpportunities },
      { count: activeOpportunities },
      { count: totalApplications },
      { count: recentUsers },
      { count: totalCoffeeChats },
      { data: viewsData },
    ] = await Promise.all([
      admin.from('profiles').select('*', { count: 'exact', head: true }),
      admin.from('opportunities').select('*', { count: 'exact', head: true }),
      admin.from('opportunities').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      admin.from('applications').select('*', { count: 'exact', head: true }),
      admin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      admin.from('coffee_chats').select('*', { count: 'exact', head: true }),
      admin.from('opportunities').select('views_count'),
    ])

    const totalViews = (viewsData || []).reduce((sum: number, o: any) => sum + (o.views_count || 0), 0)

    return ApiResponse.ok({
      totalUsers: totalUsers || 0,
      totalOpportunities: totalOpportunities || 0,
      activeOpportunities: activeOpportunities || 0,
      totalApplications: totalApplications || 0,
      recentUsers: recentUsers || 0,
      totalCoffeeChats: totalCoffeeChats || 0,
      totalViews,
    })
  } catch {
    return ApiResponse.internalError('통계 조회 중 오류가 발생했습니다')
  }
}
