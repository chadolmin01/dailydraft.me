/**
 * Discord 봇 초대 URL 리다이렉트
 *
 * GET /api/discord/install?club=slug
 * → Discord 봇 초대 페이지로 리다이렉트
 * → 봇 초대 완료 후 Draft 클럽 설정 페이지로 돌아옴
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBotInviteUrl } from '@/src/lib/discord/bot/onboarding-flow';

export async function GET(req: NextRequest) {
  const clubSlug = req.nextUrl.searchParams.get('club') ?? '';
  const inviteUrl = getBotInviteUrl();

  // guild_id를 받기 위해 redirect_uri 추가는 불가 (봇 초대는 별도 플로우)
  // 대신 봇이 GUILD_CREATE에서 자동으로 온보딩 시작
  return NextResponse.redirect(inviteUrl);
}
