/**
 * GitHub OAuth2 콜백
 *
 * GitHub 인증 완료 후 돌아오는 엔드포인트.
 * 1. code로 access_token 교환
 * 2. GitHub API로 유저 정보 조회 (/user)
 * 3. profiles.github_username, github_url 업데이트
 * 4. club_harness_connectors에 access_token 저장 (connector_type='github')
 * 5. 클럽 GitHub 설정 페이지로 리다이렉트
 *
 * 보안: access_token은 서버에서만 다루며, 절대 클라이언트에 노출하지 않는다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

const GITHUB_CLIENT_ID = (process.env.GITHUB_OAUTH_CLIENT_ID ?? '').trim()
const GITHUB_CLIENT_SECRET = (process.env.GITHUB_OAUTH_CLIENT_SECRET ?? '').trim()
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')

  // state에서 clubId, clubSlug 추출
  let clubId = ''
  let clubSlug = ''
  if (state) {
    try {
      const parsed = JSON.parse(Buffer.from(state, 'base64url').toString())
      clubId = parsed.clubId ?? ''
      clubSlug = parsed.clubSlug ?? ''
    } catch {
      // state 파싱 실패 → 에러
    }
  }

  const settingsUrl = clubSlug
    ? `/clubs/${clubSlug}/settings/github`
    : '/settings'

  if (!code) {
    return NextResponse.redirect(`${APP_URL}${settingsUrl}?error=github_auth_failed`)
  }

  if (!clubId) {
    return NextResponse.redirect(`${APP_URL}${settingsUrl}?error=github_no_club`)
  }

  try {
    // 1. Authorization code → Access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    })

    if (!tokenRes.ok) {
      console.error('[GitHub OAuth] 토큰 교환 실패:', await tokenRes.text())
      return NextResponse.redirect(`${APP_URL}${settingsUrl}?error=github_token_failed`)
    }

    const tokenData = await tokenRes.json()

    if (tokenData.error) {
      console.error('[GitHub OAuth] 토큰 에러:', tokenData.error_description)
      return NextResponse.redirect(`${APP_URL}${settingsUrl}?error=github_token_failed`)
    }

    const accessToken = tokenData.access_token as string

    // 2. Access token → GitHub 유저 정보
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    })

    if (!userRes.ok) {
      console.error('[GitHub OAuth] 유저 정보 조회 실패:', await userRes.text())
      return NextResponse.redirect(`${APP_URL}${settingsUrl}?error=github_user_failed`)
    }

    const githubUser = await userRes.json()

    // 3. Draft 유저 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(
        `${APP_URL}/login?returnTo=${encodeURIComponent(settingsUrl)}`
      )
    }

    // 4. profiles 업데이트 (github_username, github_url)
    // 기존 값이 있으면 덮어쓰지 않고, 없을 때만 채운다 (프로필에서 직접 수정 가능)
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('github_username, github_url')
      .eq('user_id', user.id)
      .single()

    const profileUpdate: Record<string, string> = {}
    if (!existingProfile?.github_username) {
      profileUpdate.github_username = githubUser.login
    }
    if (!existingProfile?.github_url) {
      profileUpdate.github_url = githubUser.html_url
    }

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('user_id', user.id)

      if (profileError) {
        console.error('[GitHub OAuth] 프로필 업데이트 실패:', profileError)
        // 프로필 업데이트 실패는 치명적이지 않으므로 계속 진행
      }
    }

    // 5. club_harness_connectors에 GitHub OAuth 커넥터 upsert
    // 이 레코드는 "이 클럽에 GitHub OAuth가 연결되어 있다"는 상태를 나타냄.
    // 개별 레포 연결은 /api/github/repos/connect에서 별도 레코드로 생성.
    //
    // credentials에 accessToken을 저장하지만, 레포(repo) 필드는 아직 없음.
    // repo가 없는 connector는 "OAuth만 연결, 레포 미선택" 상태.
    const { error: connectorError } = await supabase
      .from('club_harness_connectors')
      .upsert(
        {
          club_id: clubId,
          connector_type: 'github',
          enabled: true,
          credentials: {
            type: 'github',
            repoUrl: '',
            accessToken,
            githubUsername: githubUser.login,
            githubAvatarUrl: githubUser.avatar_url,
          },
        },
        {
          // club_id + connector_type로 중복 체크
          // 기존에 GitHub OAuth 커넥터가 있으면 토큰만 갱신
          onConflict: 'club_id,connector_type',
          ignoreDuplicates: false,
        }
      )

    if (connectorError) {
      console.error('[GitHub OAuth] 커넥터 저장 실패:', connectorError)

      // unique constraint 에러인 경우 직접 update 시도
      // upsert의 onConflict가 실제 unique constraint와 다를 수 있으므로 fallback
      if (connectorError.code === '23505' || connectorError.message?.includes('duplicate')) {
        const { error: updateError } = await supabase
          .from('club_harness_connectors')
          .update({
            enabled: true,
            credentials: {
              type: 'github',
              repoUrl: '',
              accessToken,
              githubUsername: githubUser.login,
              githubAvatarUrl: githubUser.avatar_url,
            },
          })
          .eq('club_id', clubId)
          .eq('connector_type', 'github')
          .is('opportunity_id', null)

        if (updateError) {
          console.error('[GitHub OAuth] 커넥터 fallback 업데이트 실패:', updateError)
          return NextResponse.redirect(`${APP_URL}${settingsUrl}?error=github_save_failed`)
        }
      } else {
        return NextResponse.redirect(`${APP_URL}${settingsUrl}?error=github_save_failed`)
      }
    }

    console.log(
      `[GitHub OAuth] 연결 완료: user=${user.id}, club=${clubId}, github=${githubUser.login}`
    )

    return NextResponse.redirect(
      `${APP_URL}${settingsUrl}?github=connected&github_username=${encodeURIComponent(githubUser.login)}`
    )
  } catch (err: any) {
    console.error('[GitHub OAuth] 오류:', err)
    return NextResponse.redirect(`${APP_URL}${settingsUrl}?error=github_error`)
  }
}
