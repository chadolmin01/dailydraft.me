/**
 * GitHub Webhook 수신 → Discord 알림
 *
 * GitHub에서 push, PR, issue 이벤트 발생 시
 * 해당 프로젝트의 Discord 팀 채널에 알림을 보낸다.
 *
 * 설정: GitHub repo Settings > Webhooks > Add webhook
 *   URL: https://draft.is/api/webhooks/github
 *   Content type: application/json
 *   Secret: GITHUB_WEBHOOK_SECRET 환경변수와 동일
 *   Events: Push, Pull requests, Issues
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { sendChannelMessage } from '@/src/lib/discord/client'
import crypto from 'crypto'

export const runtime = 'nodejs'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.GITHUB_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  // 1. 서명 검증 (HMAC SHA-256)
  const signature = request.headers.get('x-hub-signature-256')
  const body = await request.text()

  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex')
  if (!signature || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = request.headers.get('x-github-event')
  const payload = JSON.parse(body)

  // 2. 리포지토리 → Discord 채널 매핑 조회
  const repoFullName = payload.repository?.full_name
  if (!repoFullName) {
    return NextResponse.json({ ok: true, skipped: 'no repository' })
  }

  const admin = createAdminClient()
  const { data: mapping } = await admin
    .from('discord_team_channels')
    .select('discord_channel_id, discord_channel_name')
    .eq('github_repo', repoFullName)
    .maybeSingle()

  // github_repo 컬럼이 없거나 매핑이 없으면 환경변수 fallback
  const channelId = (mapping as { discord_channel_id?: string } | null)?.discord_channel_id
    || process.env.DISCORD_DEV_FEED_CHANNEL_ID

  if (!channelId) {
    return NextResponse.json({ ok: true, skipped: 'no channel mapping' })
  }

  // 3. 이벤트별 메시지 포맷
  let message: string | null = null

  switch (event) {
    case 'push': {
      const commits = payload.commits || []
      if (commits.length === 0) break
      const branch = payload.ref?.replace('refs/heads/', '') || 'unknown'
      const pusher = payload.pusher?.name || 'unknown'
      const commitLines = commits
        .slice(0, 5)
        .map((c: { message: string; id: string }) => `  • \`${c.id.slice(0, 7)}\` ${c.message.split('\n')[0]}`)
        .join('\n')
      const moreText = commits.length > 5 ? `\n  ... +${commits.length - 5}개 커밋` : ''
      message = `**🔨 Push** — \`${branch}\` by ${pusher}\n${commitLines}${moreText}`
      break
    }

    case 'pull_request': {
      const pr = payload.pull_request
      const action = payload.action
      if (!['opened', 'closed', 'merged'].includes(action) && !(action === 'closed' && pr.merged)) break

      const emoji = pr.merged ? '🟣' : action === 'opened' ? '🟢' : '🔴'
      const status = pr.merged ? 'Merged' : action === 'opened' ? 'Opened' : 'Closed'
      message = `**${emoji} PR ${status}** — #${pr.number} ${pr.title}\nby ${pr.user?.login || 'unknown'}\n${pr.html_url}`
      break
    }

    case 'issues': {
      const issue = payload.issue
      const action = payload.action
      if (!['opened', 'closed'].includes(action)) break

      const emoji = action === 'opened' ? '🟡' : '✅'
      message = `**${emoji} Issue ${action}** — #${issue.number} ${issue.title}\n${issue.html_url}`
      break
    }
  }

  if (!message) {
    return NextResponse.json({ ok: true, skipped: `event: ${event}` })
  }

  // 4. Discord 채널에 전송
  try {
    await sendChannelMessage(channelId, message)
    return NextResponse.json({ ok: true, event, delivered: true })
  } catch (error) {
    console.error('[github-webhook] Discord 전송 실패', error)
    return NextResponse.json({ ok: true, event, delivered: false })
  }
}
