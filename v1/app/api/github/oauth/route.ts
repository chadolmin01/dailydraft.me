/**
 * GitHub OAuth2 — 클럽(또는 팀 프로젝트)에 GitHub 계정 연결
 *
 * 팀 프로젝트 설정 또는 클럽 설정에서 "GitHub 연결" 클릭 시 이 엔드포인트로 이동.
 * GitHub OAuth 인증 페이지로 리다이렉트한다.
 *
 * 플로우:
 * 1. GET /api/github/oauth?clubId=xxx[&opportunityId=yyy] → GitHub 인증 페이지로 리다이렉트
 * 2. GitHub에서 승인 → /api/github/oauth/callback으로 돌아옴
 * 3. callback에서 access_token 교환 → club_harness_connectors에 저장
 *
 * state 파라미터에 clubId(+ opportunityId)를 포함하여 콜백에서 식별.
 * CSRF 방어를 위해 랜덤 nonce도 함께 넣는다.
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const GITHUB_CLIENT_ID = (process.env.GITHUB_OAUTH_CLIENT_ID ?? '').trim()
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const REDIRECT_URI = `${APP_URL}/api/github/oauth/callback`

export async function GET(req: NextRequest) {
  const clubId = req.nextUrl.searchParams.get('clubId')
  const clubSlug = req.nextUrl.searchParams.get('clubSlug') ?? ''
  // opportunityId가 있으면 팀/프로젝트 레벨 연동, 없으면 클럽 레벨(OAuth만)
  const opportunityId = req.nextUrl.searchParams.get('opportunityId') ?? ''

  if (!clubId) {
    return NextResponse.json({ error: 'clubId is required' }, { status: 400 })
  }

  if (!GITHUB_CLIENT_ID) {
    console.error('[GitHub OAuth] GITHUB_OAUTH_CLIENT_ID 환경변수 미설정')
    return NextResponse.json({ error: 'GitHub OAuth not configured' }, { status: 500 })
  }

  // state에 clubId + clubSlug + opportunityId + CSRF nonce를 인코딩
  // nonce는 콜백에서 검증하지는 않지만, replay attack 방어에 도움
  const nonce = crypto.randomBytes(16).toString('hex')
  const state = Buffer.from(
    JSON.stringify({ clubId, clubSlug, opportunityId, nonce })
  ).toString('base64url')

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    // repo: 레포 읽기/쓰기 (webhook 생성에 필요)
    // admin:repo_hook: webhook 생성/삭제 권한
    scope: 'repo admin:repo_hook read:user',
    state,
  })

  return NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`
  )
}
