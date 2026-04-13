/**
 * Discord OAuth2 콜백
 *
 * Discord에서 인증 완료 후 돌아오는 엔드포인트.
 * Discord user ID를 profiles.discord_user_id에 저장.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

const DISCORD_CLIENT_ID = process.env.DISCORD_APP_ID ?? '';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET ?? '';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const REDIRECT_URI = `${APP_URL}/api/discord/oauth/callback`;

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');

  if (!code) {
    return NextResponse.redirect(`${APP_URL}/settings?error=discord_auth_failed`);
  }

  // state에서 returnTo 추출
  let returnTo = '/settings';
  if (state) {
    try {
      const parsed = JSON.parse(Buffer.from(state, 'base64url').toString());
      returnTo = parsed.returnTo ?? '/settings';
    } catch {
      // 무시
    }
  }

  try {
    // 1. Authorization code → Access token
    const tokenRes = await fetch('https://discord.com/api/v10/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenRes.ok) {
      console.error('[Discord OAuth] 토큰 교환 실패:', await tokenRes.text());
      return NextResponse.redirect(`${APP_URL}${returnTo}?error=discord_token_failed`);
    }

    const tokenData = await tokenRes.json();

    // 2. Access token → Discord 유저 정보
    const userRes = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(`${APP_URL}${returnTo}?error=discord_user_failed`);
    }

    const discordUser = await userRes.json();

    // 3. Draft 계정에 discord_user_id 저장
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${APP_URL}/login?returnTo=${encodeURIComponent(returnTo)}`);
    }

    // 이미 다른 계정에 연결된 Discord인지 확인
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('user_id, nickname')
      .eq('discord_user_id', discordUser.id)
      .neq('user_id', user.id)
      .maybeSingle();

    if (existingProfile) {
      // 기존 계정의 discord_user_id를 제거하고 새 계정에 연결
      // (한 Discord 계정은 하나의 Draft 계정에만 연결)
      await supabase
        .from('profiles')
        .update({ discord_user_id: null, discord_username: null })
        .eq('user_id', existingProfile.user_id);

      console.warn(
        `[Discord OAuth] Discord ${discordUser.id}가 다른 계정(${existingProfile.user_id})에서 해제 → ${user.id}로 이전`
      );
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        discord_user_id: discordUser.id,
        // Discord 닉네임도 참고용으로 저장
        discord_username: discordUser.username,
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('[Discord OAuth] 프로필 업데이트 실패:', error);
      return NextResponse.redirect(`${APP_URL}${returnTo}?error=discord_save_failed`);
    }

    console.log(`[Discord OAuth] 연결 완료: ${user.id} ↔ ${discordUser.username} (${discordUser.id})`);

    return NextResponse.redirect(
      `${APP_URL}${returnTo}?discord=connected&discord_username=${encodeURIComponent(discordUser.username)}`
    );
  } catch (err: any) {
    console.error('[Discord OAuth] 오류:', err);
    return NextResponse.redirect(`${APP_URL}${returnTo}?error=discord_error`);
  }
}
