import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { NextRequest } from 'next/server'

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const meta = user.app_metadata as Record<string, unknown> | undefined
  if (!meta?.is_admin) return null
  return user
}

/** GET — 전체 institution 목록 */
export async function GET() {
  try {
    const supabase = await createClient()
    const user = await requireAdmin(supabase)
    if (!user) return ApiResponse.forbidden('관리자 권한이 필요합니다')

    const { data, error } = await supabase
      .from('institutions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // 각 institution의 멤버 수 조회
    const enriched = await Promise.all(
      (data || []).map(async (inst) => {
        const { count } = await supabase
          .from('institution_members')
          .select('id', { count: 'exact', head: true })
          .eq('institution_id', inst.id)
          .eq('status', 'active')
        return { ...inst, member_count: count || 0 }
      })
    )

    return ApiResponse.ok(enriched)
  } catch {
    return ApiResponse.internalError('기관 목록 조회 중 오류가 발생했습니다')
  }
}

/** POST — 새 institution 생성 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await requireAdmin(supabase)
    if (!user) return ApiResponse.forbidden('관리자 권한이 필요합니다')

    const body = await request.json()
    const { name, university, type = 'startup_center', description, email_domains, contact_email } = body

    if (!name || !university) {
      return ApiResponse.badRequest('기관명과 대학명은 필수입니다')
    }

    const { data, error } = await supabase
      .from('institutions')
      .insert({
        name,
        university,
        type,
        description: description || null,
        email_domains: Array.isArray(email_domains) ? email_domains : [],
        contact_email: contact_email || null,
      })
      .select()
      .single()

    if (error) throw error
    return ApiResponse.created(data)
  } catch {
    return ApiResponse.internalError('기관 생성 중 오류가 발생했습니다')
  }
}
