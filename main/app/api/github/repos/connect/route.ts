/**
 * GitHub 레포 연결 API — webhook 자동 생성 (팀/프로젝트 단위)
 *
 * POST /api/github/repos/connect
 * Body: { clubId, repoFullName, opportunityId } (예: "owner/repo")
 *
 * 1. 클럽의 GitHub OAuth connector에서 accessToken 가져오기
 * 2. GitHub API로 webhook 생성 (push, pull_request, issues 이벤트)
 * 3. club_harness_connectors에 레포별 레코드 생성
 *    - opportunity_id를 포함하여 프로젝트 단위로 레포 연결
 *    - discord_team_channels에서 해당 프로젝트의 Discord 채널 ID를 조회하여 저장
 *
 * webhook secret은 레포별로 고유 생성 — 각 레포가 독립적으로 서명 검증 가능.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import crypto from 'crypto'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clubId, repoFullName, opportunityId } = body as {
      clubId?: string
      repoFullName?: string
      opportunityId?: string
    }

    if (!clubId || !repoFullName) {
      return NextResponse.json(
        { error: 'clubId와 repoFullName이 필요합니다.' },
        { status: 400 }
      )
    }

    if (!opportunityId) {
      return NextResponse.json(
        { error: 'opportunityId가 필요합니다. 팀 프로젝트 설정에서 레포를 연결해주세요.' },
        { status: 400 }
      )
    }

    // owner/repo 형식 검증
    const repoParts = repoFullName.split('/')
    if (repoParts.length !== 2 || !repoParts[0] || !repoParts[1]) {
      return NextResponse.json(
        { error: '유효하지 않은 레포 형식입니다. "owner/repo" 형식이어야 합니다.' },
        { status: 400 }
      )
    }

    const [owner, repo] = repoParts
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. 클럽의 GitHub OAuth connector에서 accessToken 가져오기
    const { data: oauthConnector } = await supabase
      .from('club_harness_connectors')
      .select('credentials')
      .eq('club_id', clubId)
      .eq('connector_type', 'github')
      .is('opportunity_id', null)
      .single()

    if (!oauthConnector) {
      return NextResponse.json(
        { error: 'GitHub이 연결되지 않았습니다.' },
        { status: 404 }
      )
    }

    const credentials = oauthConnector.credentials as any
    const accessToken = credentials?.accessToken

    if (!accessToken) {
      return NextResponse.json(
        { error: 'GitHub 토큰이 만료되었습니다. 다시 연결해주세요.' },
        { status: 401 }
      )
    }

    // 2. 해당 프로젝트의 Discord 팀 채널 조회
    // push 알림을 이 채널로 보내기 위해 credentials에 저장
    const admin = createAdminClient()
    let discordChannelId: string | null = null

    const { data: teamChannel } = await admin
      .from('discord_team_channels')
      .select('discord_channel_id')
      .eq('club_id', clubId)
      .eq('opportunity_id', opportunityId)
      .maybeSingle()

    if (teamChannel) {
      discordChannelId = teamChannel.discord_channel_id
    }

    // 3. webhook secret 생성 (레포별 고유)
    const webhookSecret = crypto.randomBytes(32).toString('hex')

    // 4. GitHub API로 webhook 생성
    const webhookRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/hooks`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'web',
          active: true,
          events: ['push', 'pull_request', 'issues'],
          config: {
            url: `${APP_URL}/api/webhooks/github`,
            content_type: 'json',
            secret: webhookSecret,
            insecure_ssl: '0',
          },
        }),
        signal: AbortSignal.timeout(10_000),
      }
    )

    if (!webhookRes.ok) {
      const errorBody = await webhookRes.text()
      console.error('[GitHub Connect] webhook 생성 실패:', webhookRes.status, errorBody)

      // 422 = 이미 동일 URL의 webhook이 존재
      if (webhookRes.status === 422) {
        return NextResponse.json(
          { error: '이미 이 레포에 Draft webhook이 존재합니다. 기존 webhook을 삭제한 후 다시 시도해주세요.' },
          { status: 409 }
        )
      }

      // 403 = admin 권한 없음
      if (webhookRes.status === 403 || webhookRes.status === 404) {
        return NextResponse.json(
          { error: '이 레포에 webhook을 생성할 권한이 없습니다. 레포의 Admin 권한이 필요합니다.' },
          { status: 403 }
        )
      }

      return NextResponse.json(
        { error: 'GitHub webhook 생성에 실패했습니다.' },
        { status: 502 }
      )
    }

    const webhookData = await webhookRes.json()
    const webhookId = webhookData.id

    // 5. club_harness_connectors에 레포별 레코드 생성
    // opportunity_id를 포함하여 프로젝트 단위로 레포 연결
    const { error: insertError } = await supabase
      .from('club_harness_connectors')
      .insert({
        club_id: clubId,
        opportunity_id: opportunityId,
        connector_type: 'github',
        enabled: true,
        credentials: {
          type: 'github',
          repoUrl: `https://github.com/${repoFullName}`,
          accessToken,
          repo: repoFullName,
          webhookSecret,
          webhookId: String(webhookId),
          // Discord 팀 채널 ID를 저장하여 webhook 수신 시 빠르게 조회 가능
          // discord_team_channels가 변경되면 이 값도 갱신해야 할 수 있으나,
          // webhook handler에서 discord_team_channels를 직접 조회하므로 캐시 역할만 함
          discordChannelId,
        },
      })

    if (insertError) {
      console.error('[GitHub Connect] connector 저장 실패:', insertError)

      // webhook은 생성됐지만 DB 저장 실패 → webhook 정리 시도
      try {
        await fetch(
          `https://api.github.com/repos/${owner}/${repo}/hooks/${webhookId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28',
            },
          }
        )
      } catch {
        console.error('[GitHub Connect] webhook 정리도 실패 — 수동 삭제 필요')
      }

      return NextResponse.json(
        { error: '레포 연결 정보 저장에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log(
      `[GitHub Connect] 레포 연결 완료: club=${clubId}, opportunity=${opportunityId}, repo=${repoFullName}, webhookId=${webhookId}, discordChannel=${discordChannelId || 'none'}`
    )

    return NextResponse.json({
      ok: true,
      repo: repoFullName,
      webhookId: String(webhookId),
      discordChannelId,
    })
  } catch (err: any) {
    console.error('[GitHub Connect] 오류:', err)
    return NextResponse.json(
      { error: '레포 연결 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
