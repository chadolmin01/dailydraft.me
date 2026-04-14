/**
 * GitHub 연동 테스트 알림 API
 *
 * 연결된 Discord 채널로 테스트 메시지를 보내서 연동이 정상 작동하는지 확인.
 * POST /api/github/test-notification
 * body: { clubId, opportunityId, repoFullName }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { sendChannelMessage } from '@/src/lib/discord/bot/discord-actions'
import { createForumThread } from '@/src/lib/discord/client'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clubId, opportunityId, repoFullName } = await req.json()

    if (!clubId || !repoFullName) {
      return NextResponse.json({ error: 'clubId와 repoFullName이 필요합니다.' }, { status: 400 })
    }

    // 해당 레포의 connector 조회
    const query = supabase
      .from('club_harness_connectors')
      .select('credentials')
      .eq('club_id', clubId)
      .eq('connector_type', 'github')

    if (opportunityId) {
      query.eq('opportunity_id', opportunityId)
    }

    const { data: connectors } = await query

    // credentials.repo로 매칭
    const connector = connectors?.find((c: any) => {
      const creds = c.credentials as any
      return creds?.repo === repoFullName
    })

    if (!connector) {
      return NextResponse.json(
        { error: '해당 레포의 연결 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const credentials = connector.credentials as any
    const discordChannelId = credentials?.discordChannelId
    const isForumChannel = credentials?.isForumChannel === true

    if (!discordChannelId) {
      // discord_team_channels에서 fallback
      if (opportunityId) {
        const { data: teamChannel } = await supabase
          .from('discord_team_channels')
          .select('discord_channel_id')
          .eq('opportunity_id', opportunityId)
          .maybeSingle()

        if (teamChannel?.discord_channel_id) {
          const message = `**[GitHub 테스트]** ${repoFullName} 연동이 정상 작동합니다.\n이 메시지가 보이면 push 알림도 정상적으로 수신됩니다.`
          await sendChannelMessage(teamChannel.discord_channel_id, message)
          return NextResponse.json({ success: true, channel: 'team_channel' })
        }
      }

      return NextResponse.json(
        { error: '알림을 보낼 Discord 채널이 설정되지 않았습니다.' },
        { status: 400 }
      )
    }

    // 테스트 메시지 전송
    const testMessage = `**[GitHub 테스트]** \`${repoFullName}\` 연동이 정상 작동합니다.\n이 메시지가 보이면 push 알림도 정상적으로 수신됩니다.`

    if (isForumChannel) {
      await createForumThread(
        discordChannelId,
        `[테스트] ${repoFullName} 연동 확인`,
        testMessage
      )
    } else {
      await sendChannelMessage(discordChannelId, testMessage)
    }

    return NextResponse.json({ success: true, channel: isForumChannel ? 'forum' : 'text' })
  } catch (err: any) {
    console.error('[GitHub Test] 오류:', err)
    return NextResponse.json(
      { error: '테스트 알림 전송에 실패했습니다.' },
      { status: 500 }
    )
  }
}
