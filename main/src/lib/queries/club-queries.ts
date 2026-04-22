/**
 * Shared club query functions — used by both the API route (/api/clubs/[slug])
 * and server component prefetch (app/(dashboard)/clubs/[slug]/page.tsx).
 *
 * 분리 이유: 서버 컴포넌트에서 prefetch하려면 클라이언트 훅이 호출하는 fetch(/api/...)와
 * "동일한 형상의 데이터"를 캐시에 넣어야 hydrate miss가 안 난다. API route와 prefetch가
 * 각자 쿼리를 짜면 join·정렬이 어긋나 결국 클라이언트에서 재fetch하게 됨.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/src/types/database'
import type { ClubDetail } from '@/src/hooks/useClub'
import type { ClubCard } from '@/components/explore/types'

type TypedClient = SupabaseClient<Database>

// 클라이언트 훅과 key 일치: clubKeys.detail(slug) = ['clubs', 'detail', slug]
export const clubDetailKey = (slug: string) => ['clubs', 'detail', slug] as const

/**
 * 클럽 상세 조회 — api/clubs/[slug]와 동일한 응답 형상을 반환.
 * userId가 있으면 my_role 포함(본인 역할). 비로그인은 null.
 */
export async function fetchClubDetail(
  supabase: TypedClient,
  slug: string,
  userId: string | null,
): Promise<ClubDetail | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: club, error } = await (supabase as any)
    .from('clubs')
    .select(`
      id, slug, name, description, logo_url, category,
      visibility, require_approval, team_channel_visibility,
      created_by, created_at, updated_at,
      claim_status, university_id,
      verification_submitted_at, verification_reviewed_at, verification_note,
      verification_documents
    `)
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  if (!club) return null

  const { count: memberCount } = await supabase
    .from('club_members')
    .select('id', { count: 'exact', head: true })
    .eq('club_id', club.id)

  const { data: cohorts } = await supabase
    .from('club_members')
    .select('cohort')
    .eq('club_id', club.id)
    .not('cohort', 'is', null)

  const uniqueCohorts = [...new Set((cohorts || []).map(c => c.cohort))]
    .filter(Boolean)
    .sort() as string[]

  const { data: credentials } = await supabase
    .from('club_credentials')
    .select('id, credential_type, verification_method, verified_at, university_id')
    .eq('club_id', club.id)

  const universityIds = (credentials || [])
    .map(c => c.university_id)
    .filter(Boolean) as string[]

  let universities: Record<string, { name: string; short_name: string | null }> = {}
  if (universityIds.length > 0) {
    const { data: univData } = await supabase
      .from('universities')
      .select('id, name, short_name')
      .in('id', universityIds)

    universities = Object.fromEntries(
      (univData || []).map(u => [u.id, { name: u.name, short_name: u.short_name }])
    )
  }

  const badges = (credentials || []).map(c => ({
    id: c.id,
    type: c.credential_type,
    method: c.verification_method,
    verified_at: c.verified_at,
    university: c.university_id ? universities[c.university_id] : null,
  }))

  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('user_id, nickname, avatar_url')
    .eq('user_id', club.created_by)
    .maybeSingle()

  // my_role: 멤버 페이지네이션에 의존하지 않고 별도 1건 쿼리로 확실하게.
  let myRole: string | null = null
  if (userId) {
    const { data: myMembership } = await supabase
      .from('club_members')
      .select('role')
      .eq('club_id', club.id)
      .eq('user_id', userId)
      .maybeSingle()
    myRole = myMembership?.role ?? null
  }

  return {
    ...club,
    member_count: memberCount ?? 0,
    cohorts: uniqueCohorts,
    badges,
    owner: ownerProfile || { user_id: club.created_by, nickname: null, avatar_url: null },
    my_role: myRole,
  } as ClubDetail
}

/**
 * 클럽 목록 — /api/clubs와 동일한 필터/정렬/멤버수 집계.
 * ExplorePageClient의 ['explore', 'clubs', q] 및 clubs/page.tsx의 ['clubs', 'list', category] 키에 매칭.
 */
export async function fetchClubsList(
  supabase: TypedClient,
  opts: { q?: string; category?: string; limit?: number; offset?: number } = {},
): Promise<{ items: ClubCard[]; total: number }> {
  const { q, category, limit = 20, offset = 0 } = opts

  let query = supabase
    .from('clubs')
    .select('id, slug, name, description, logo_url, category, created_at')
    // 공개 목록: verified 만 (pending/rejected 는 RLS 로도 차단되지만 명시적 필터 이중 방어)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .eq('claim_status' as any, 'verified')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
  if (category && category !== '전체') query = query.eq('category', category)

  const { data: clubs, error } = await query
  if (error) throw error
  if (!clubs || clubs.length === 0) return { items: [], total: 0 }

  const clubIds = clubs.map(c => c.id)
  const { data: memberRows } = await supabase
    .from('club_members')
    .select('club_id')
    .in('club_id', clubIds)
  const countMap: Record<string, number> = {}
  memberRows?.forEach(m => { countMap[m.club_id] = (countMap[m.club_id] || 0) + 1 })

  const items = clubs.map(club => ({
    id: club.id,
    slug: club.slug,
    name: club.name,
    description: club.description,
    logo_url: club.logo_url,
    category: club.category,
    member_count: countMap[club.id] ?? 0,
  })) as ClubCard[]

  return { items, total: items.length }
}

/**
 * 내 클럽 목록 — /api/clubs?my=1와 동일.
 * userId 필수, 없으면 빈 배열.
 */
export async function fetchMyClubs(
  supabase: TypedClient,
  userId: string,
  limit = 20,
): Promise<{ items: ClubCard[]; total: number }> {
  const { data: memberships } = await supabase
    .from('club_members')
    .select('club_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(limit)

  if (!memberships || memberships.length === 0) return { items: [], total: 0 }

  const myClubIds = memberships.map(m => m.club_id)
  const { data: myClubs } = await supabase
    .from('clubs')
    .select('id, slug, name, description, logo_url, category')
    .in('id', myClubIds)

  if (!myClubs || myClubs.length === 0) return { items: [], total: 0 }

  const { data: memberRows } = await supabase
    .from('club_members')
    .select('club_id')
    .in('club_id', myClubIds)
  const countMap: Record<string, number> = {}
  memberRows?.forEach(m => { countMap[m.club_id] = (countMap[m.club_id] || 0) + 1 })

  const items = myClubs.map(club => ({
    id: club.id,
    slug: club.slug,
    name: club.name,
    description: club.description,
    logo_url: club.logo_url,
    category: club.category,
    member_count: countMap[club.id] ?? 0,
  })) as ClubCard[]

  return { items, total: items.length }
}
