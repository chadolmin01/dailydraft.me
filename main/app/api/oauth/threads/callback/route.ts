import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { encryptToken } from '@/src/lib/personas/token-crypto'

/**
 * GET /api/oauth/threads/callback?code=...&state=...
 *
 * Threads OAuth 완료 콜백.
 *
 * 흐름:
 *   1. state 쿠키 + 쿼리 nonce 일치 검증 (CSRF)
 *   2. code → short-lived access token (1시간) 교환
 *   3. short-lived → long-lived token (60일) 교환
 *      (Threads는 LinkedIn과 달리 2단계 교환이 기본)
 *   4. /me?fields=id,username으로 계정 ref 조회
 *   5. 암호화 → persona_channel_credentials upsert
 *   6. return_to?threads=ok 리다이렉트
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const stateNonce = searchParams.get('state')
  const error = searchParams.get('error')

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    'http://localhost:3000'

  const stateCookie = request.cookies.get('threads_oauth_state')?.value
  const fallbackReturn = '/'

  const buildReturnUrl = (returnTo: string, status: 'ok' | 'error', msg?: string) => {
    const url = new URL(returnTo.startsWith('/') ? `${appUrl}${returnTo}` : returnTo)
    url.searchParams.set('threads', status)
    if (msg) url.searchParams.set('msg', msg)
    return url.toString()
  }

  if (error) {
    return NextResponse.redirect(
      buildReturnUrl(fallbackReturn, 'error', `Threads 거절: ${error}`),
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

  if (stateData.nonce !== stateNonce) {
    return NextResponse.redirect(
      buildReturnUrl(stateData.return_to || fallbackReturn, 'error', 'state 불일치'),
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.id !== stateData.user_id) {
    return NextResponse.redirect(
      buildReturnUrl(stateData.return_to, 'error', '로그인 세션 변경됨'),
    )
  }

  const clientId = process.env.THREADS_CLIENT_ID
  const clientSecret = process.env.THREADS_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      buildReturnUrl(stateData.return_to, 'error', 'Threads 앱 설정 누락'),
    )
  }

  const redirectUri = `${appUrl}/api/oauth/threads/callback`

  try {
    // 1) code → short-lived access token (1h)
    const shortTokenRes = await fetch(
      'https://graph.threads.net/oauth/access_token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      },
    )

    if (!shortTokenRes.ok) {
      const body = await shortTokenRes.text()
      console.error('[threads_oauth] short token 실패:', body)
      return NextResponse.redirect(
        buildReturnUrl(stateData.return_to, 'error', '단기 토큰 교환 실패'),
      )
    }

    const shortJson = (await shortTokenRes.json()) as {
      access_token: string
      user_id: string | number
    }

    // 2) short-lived → long-lived (60일). 재연결 UX 줄이려면 필수.
    //    실패 시 short-lived만 저장하고 UI는 "곧 만료" 안내.
    let accessToken = shortJson.access_token
    let expiresIn = 60 * 60 // 1h fallback

    const longTokenRes = await fetch(
      `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${encodeURIComponent(clientSecret)}&access_token=${encodeURIComponent(shortJson.access_token)}`,
    )

    if (longTokenRes.ok) {
      const longJson = (await longTokenRes.json()) as {
        access_token: string
        expires_in: number // seconds, 보통 5184000 (60일)
      }
      accessToken = longJson.access_token
      expiresIn = longJson.expires_in ?? 5184000
    } else {
      console.warn(
        '[threads_oauth] long-lived 교환 실패 — short-lived(1h)로 저장',
        await longTokenRes.text().catch(() => ''),
      )
    }

    // 3) /me로 user id + username 조회 (account_ref에 사용)
    const meRes = await fetch(
      `https://graph.threads.net/v1.0/me?fields=id,username&access_token=${encodeURIComponent(accessToken)}`,
    )
    if (!meRes.ok) {
      const body = await meRes.text()
      console.error('[threads_oauth] /me 실패:', body)
      return NextResponse.redirect(
        buildReturnUrl(stateData.return_to, 'error', '사용자 정보 조회 실패'),
      )
    }
    const meJson = (await meRes.json()) as {
      id: string
      username?: string
    }

    // 4) 권한 재확인
    const admin = createAdminClient()
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

    const encryptedToken = encryptToken(accessToken)
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    const { error: upErr } = await admin
      .from('persona_channel_credentials')
      .upsert(
        {
          persona_id: stateData.persona_id,
          channel_type: 'threads',
          account_ref: meJson.id,
          encrypted_token: encryptedToken,
          scope: ['threads_basic', 'threads_content_publish'],
          installed_by: user.id,
          expires_at: expiresAt,
          active: true,
        } as never,
        { onConflict: 'persona_id,channel_type,account_ref' },
      )

    if (upErr) {
      console.error('[threads_oauth] credential upsert 실패:', upErr)
      return NextResponse.redirect(
        buildReturnUrl(stateData.return_to, 'error', 'DB 저장 실패'),
      )
    }

    const res = NextResponse.redirect(buildReturnUrl(stateData.return_to, 'ok'))
    res.cookies.set('threads_oauth_state', '', { maxAge: 0, path: '/' })
    return res
  } catch (err) {
    console.error('[threads_oauth] 예외:', err)
    return NextResponse.redirect(
      buildReturnUrl(stateData.return_to, 'error', '내부 오류'),
    )
  }
}
