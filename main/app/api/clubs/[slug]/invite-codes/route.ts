import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { randomBytes } from 'crypto'

function generateCode(): string {
  // 8자리 알파벳+숫자 (읽기 쉽게 O/0/I/l 제외)
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const bytes = randomBytes(8)
  return Array.from(bytes)
    .map(b => chars[b % chars.length])
    .join('')
}

// 공통: 호출자가 이 클럽의 owner/admin 인지 검증.
// 2026-04-18 P1-12 감사: 기존 GET/POST가 로그인만 체크하고 멤버십 role을 확인 안 해서
// 임의 유저가 어떤 클럽이든 초대 코드를 조회·생성 가능한 P0 보안 이슈였음. 이 헬퍼로 일원화.
type AuthCheckError = { error: Response }
type AuthCheckOk = {
  supabase: Awaited<ReturnType<typeof createClient>>
  user: NonNullable<Awaited<ReturnType<Awaited<ReturnType<typeof createClient>>['auth']['getUser']>>['data']['user']>
  club: { id: string }
}

async function requireClubAdmin(slug: string): Promise<AuthCheckError | AuthCheckOk> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: ApiResponse.unauthorized() }

  const { data: club } = await supabase
    .from('clubs')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (!club) return { error: ApiResponse.notFound('클럽을 찾을 수 없습니다') }

  const { data: membership } = await supabase
    .from('club_members')
    .select('role')
    .eq('club_id', club.id)
    .eq('user_id', user.id)
    .in('role', ['owner', 'admin'])
    .maybeSingle()

  if (!membership) {
    return { error: ApiResponse.forbidden('운영진만 초대 코드를 관리할 수 있습니다') }
  }

  return { supabase, user, club }
}

// GET /api/clubs/[slug]/invite-codes — 코드 목록 (owner/admin)
export const GET = withErrorCapture(
  async (_request, context) => {
    const { slug } = await context.params

    const check = await requireClubAdmin(slug)
    if ('error' in check) return check.error
    const { supabase, club } = check

    const { data: codes, error } = await supabase
      .from('club_invite_codes')
      .select('*')
      .eq('club_id', club.id)
      .order('created_at', { ascending: false })

    if (error) return ApiResponse.internalError(error.message)

    return ApiResponse.ok(codes)
  }
)

// POST /api/clubs/[slug]/invite-codes — 코드 생성 (owner/admin)
export const POST = withErrorCapture(
  async (request, context) => {
    const { slug } = await context.params

    const check = await requireClubAdmin(slug)
    if ('error' in check) return check.error
    const { supabase, user, club } = check

    const body = await request.json()
    const customCode = body.code?.trim()
    const code = customCode || generateCode()

    // 커스텀 코드 유효성: 영문, 숫자, 하이픈, 한글만 허용 (2~30자)
    if (customCode && !/^[\w가-힣\-]{2,30}$/u.test(customCode)) {
      return ApiResponse.badRequest('코드는 2~30자, 영문/숫자/한글/하이픈만 가능합니다')
    }

    // 기본 만료: 90일
    const expiresAt = body.expires_at || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()

    const { data: newCode, error } = await supabase
      .from('club_invite_codes')
      .insert({
        club_id: club.id,
        code,
        cohort: body.cohort || null,
        role: body.role === 'admin' ? 'admin' : 'member',
        max_uses: body.max_uses ?? null,
        expires_at: expiresAt,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return ApiResponse.badRequest('이미 사용 중인 코드입니다')
      }
      return ApiResponse.internalError(error.message)
    }

    return ApiResponse.ok(newCode)
  }
)
