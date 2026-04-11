/**
 * Discord OAuth2 계정 연결
 *
 * Draft 계정에 Discord 계정을 연결하는 엔드포인트.
 * Supabase Auth의 Discord provider가 아닌, 별도 OAuth 플로우로 discord_user_id만 저장.
 *
 * 플로우:
 * 1. GET /api/discord/oauth → Discord 인증 페이지로 리다이렉트
 * 2. Discord에서 승인 → /api/discord/oauth/callback으로 돌아옴
 * 3. access_token으로 Discord 유저 정보 조회 → profiles.discord_user_id 저장
 */

import { NextRequest, NextResponse } from 'next/server';

const DISCORD_CLIENT_ID = process.env.DISCORD_APP_ID ?? '';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const REDIRECT_URI = `${APP_URL}/api/discord/oauth/callback`;

/**
 * GET /api/discord/oauth
 * Discord OAuth 인증 페이지로 리다이렉트
 *
 * Query params:
 *   returnTo — 인증 완료 후 돌아갈 Draft 페이지 경로
 */
export async function GET(req: NextRequest) {
  const returnTo = req.nextUrl.searchParams.get('returnTo') ?? '/settings';

  // state에 returnTo를 인코딩하여 콜백에서 사용
  const state = Buffer.from(JSON.stringify({ returnTo })).toString('base64url');

  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'identify guilds',
    state,
  });

  return NextResponse.redirect(
    `https://discord.com/oauth2/authorize?${params.toString()}`
  );
}
