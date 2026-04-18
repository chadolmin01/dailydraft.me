import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { encryptToken } from '@/src/lib/personas/token-crypto'

/**
 * GET /api/oauth/linkedin/callback?code=...&state=...
 *
 * LinkedIn 인증 완료 후 리다이렉트되는 엔드포인트.
 *
 * 흐름:
 *   1. state 쿠키 + 쿼리 파람 nonce 일치 검증 (CSRF 방어)
 *   2. code를 access_token으로 교환
 *   3. /v2/userinfo로 사용자 URN(sub) 조회 — 발행 시 author 필드에 필요
 *   4. access_token 암호화 → persona_channel_credentials upsert
 *   5. return_to로 리다이렉트 (쿼리에 성공/실패 플래그)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const stateNonce = searchParams.get('state')
  const error = searchParams.get('error')

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    'http://localhost:3000'

  // 쿠키에서 state data 복원
  const stateCookie = request.cookies.get('linkedin_oauth_state')?.value
  const fallbackReturn = '/'

  const buildReturnUrl = (returnTo: string, status: 'ok' | 'error', msg?: string) => {
    const url = new URL(returnTo.startsWith('/') ? `${appUrl}${returnTo}` : returnTo)
    url.searchParams.set('linkedin', status)
    if (msg) url.searchParams.set('msg', msg)
    return url.toString()
  }

  // 유저가 거부한 경우
  if (error) {
    return NextResponse.redirect(
      buildReturnUrl(fallbackReturn, 'error', `LinkedIn 거절: ${error}`),
    )
  }

  if (!code || !stateNonce || !stateCookie) {
    return NextResponse.redirect(
      buildReturnUrl(fallbackReturn, 'error', 'OAuth state 누락'),
    )
  }

  let stateData: {
    nonce: string
    persona_id: string
    return_to: string
    user_id: string
  }
  try {
    stateData = JSON.parse(
      Buffer.from(stateCookie, 'base64url').toString('utf8'),
    )
  } catch {
    return NextResponse.redirect(
      buildReturnUrl(fallbackReturn, 'error', '쿠키 파싱 실패'),
    )
  }

  // CSRF 검증
  if (stateData.nonce !== stateNonce) {
    return NextResponse.redirect(
      buildReturnUrl(stateData.return_to || fallbackReturn, 'error', 'state 불일치'),
    )
  }

  // 현재 로그인 유저 = state 시작 유저 일치 확인
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.id !== stateData.user_id) {
    return NextResponse.redirect(
      buildReturnUrl(stateData.return_to, 'error', '로그인 세션 변경됨'),
    )
  }

  // 환경변수
  const clientId = process.env.LINKEDIN_CLIENT_ID
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      buildReturnUrl(stateData.return_to, 'error', 'LinkedIn 앱 설정 누락'),
    )
  }

  const redirectUri = `${appUrl}/api/oauth/linkedin/callback`

  try {
    // 1) code → access_token 교환
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    if (!tokenRes.ok) {
      const body = await tokenRes.text()
      console.error('[linkedin_oauth] token exchange 실패:', body)
      return NextResponse.redirect(
        buildReturnUrl(stateData.return_to, 'error', '토큰 교환 실패'),
      )
    }

    const tokenJson = (await tokenRes.json()) as {
      access_token: string
      expires_in: number // seconds (보통 5184000 = 60일)
      scope?: string
    }

    // 2) /v2/userinfo로 사용자 URN 조회 (OpenID Connect)
    const userInfoRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    })
    if (!userInfoRes.ok) {
      const body = await userInfoRes.text()
      console.error('[linkedin_oauth] userinfo 실패:', body)
      return NextResponse.redirect(
        buildReturnUrl(stateData.return_to, 'error', '사용자 정보 조회 실패'),
      )
    }
    const userInfo = (await userInfoRes.json()) as {
      sub: string // LinkedIn member URN ID (e.g., "abc12345")
      name?: string
      email?: string
    }

    // 3) 토큰 암호화 + DB 저장
    const admin = createAdminClient()

    // 권한 재확인 — personal이 아닌 club 페르소나는 is_club_admin
    const { data: persona } = await admin
      .from('personas')
      .select('type, owner_id')
      .eq('id', stateData.persona_id)
      .maybeSingle<{ type: string; owner_id: string }>()
    if (!persona) {
      return NextResponse.redirect(
        buildReturnUrl(stateData.return_to, 'error', '페르소나 없음'),
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: canEdit } = await (admin as any).rpc('can_edit_persona_owner', {
      p_type: persona.type,
      p_owner_id: persona.owner_id,
      p_user_id: user.id,
    })
    if (!canEdit) {
      return NextResponse.redirect(
        buildReturnUrl(stateData.return_to, 'error', '권한 없음'),
      )
    }

    const encryptedToken = encryptToken(tokenJson.access_token)
    const expiresAt = new Date(
      Date.now() + (tokenJson.expires_in ?? 5184000) * 1000,
    ).toISOString()

    // upsert — 같은 persona+channel+account는 토큰만 갱신
    const { error: upErr } = await admin
      .from('persona_channel_credentials')
      .upsert(
        {
          persona_id: stateData.persona_id,
          channel_type: 'linkedin',
          account_ref: userInfo.sub, // LinkedIn URN id
          encrypted_token: encryptedToken,
          scope: (tokenJson.scope ?? '').split(/\s+/).filter(Boolean),
          installed_by: user.id,
          expires_at: expiresAt,
          active: true,
        } as never,
        { onConflict: 'persona_id,channel_type,account_ref' },
      )

    if (upErr) {
      console.error('[linkedin_oauth] credential upsert 실패:', upErr)
      return NextResponse.redirect(
        buildReturnUrl(stateData.return_to, 'error', 'DB 저장 실패'),
      )
    }

    // 성공
    const res = NextResponse.redirect(buildReturnUrl(stateData.return_to, 'ok'))
    // state 쿠키 삭제
    res.cookies.set('linkedin_oauth_state', '', { maxAge: 0, path: '/' })
    return res
  } catch (err) {
    console.error('[linkedin_oauth] 예외:', err)
    return NextResponse.redirect(
      buildReturnUrl(stateData.return_to, 'error', '내부 오류'),
    )
  }
}
