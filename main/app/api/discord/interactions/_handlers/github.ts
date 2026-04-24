import { NextResponse } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { APP_URL } from '@/src/constants'
import { CHANNEL_MESSAGE, EPHEMERAL } from '../_constants'

// GitHub 연동 관리 커맨드 모음. route.ts 에서 분리 — 핸들러 자체 로직은 1:1 보존.
// 채널 → 프로젝트 매핑: discord_team_channels 에서 channel_id 로 프로젝트를 감지해
// 팀/프로젝트 레벨로 GitHub 연동을 관리한다 (기존 guild_id → club_id 패턴에서 전환).

/**
 * 채널 ID로 프로젝트 매핑 조회.
 * discord_team_channels 테이블에서 해당 채널이 어떤 프로젝트에 연결되어 있는지 확인.
 */
async function findProjectByChannel(
  supabase: ReturnType<typeof createAdminClient>,
  channelId: string
) {
  const { data } = await supabase
    .from('discord_team_channels')
    .select('opportunity_id, club_id')
    .eq('discord_channel_id', channelId)
    .maybeSingle()
  return data // { opportunity_id, club_id } or null
}

// ── /github — 서브커맨드 디스패처 ──
export async function handleGitHubCommand(interaction: {
  guild_id?: string
  channel_id?: string
  member?: { user?: { id: string } }
  user?: { id: string }
  data?: {
    options?: {
      name: string
      type: number
      options?: { name: string; value: string }[]
    }[]
  }
}) {
  // 서브커맨드 파싱 (Discord SUB_COMMAND 구조: data.options[0] = 서브커맨드)
  const subCommand = interaction.data?.options?.[0]
  const subName = subCommand?.name

  if (subName === '연결') {
    return handleGitHubConnect(interaction)
  }
  if (subName === '목록') {
    return handleGitHubList(interaction)
  }
  if (subName === '해제') {
    return handleGitHubDisconnect(interaction)
  }
  // /github 내계정은 프로필 업데이트라 프로젝트 무관 — 기존 로직 유지
  if (subName === '내계정') {
    return handleGitHubAccount(interaction)
  }

  return NextResponse.json({
    type: CHANNEL_MESSAGE,
    data: {
      content:
        '알 수 없는 서브커맨드입니다. `/github` 다음에 연결, 목록, 해제, 내계정 중 하나를 입력해주세요.',
      flags: EPHEMERAL,
    },
  })
}

// ── /github 연결 — 현재 채널의 프로젝트에 GitHub OAuth 연결 버튼 제공 ──
// channel_id → discord_team_channels 에서 프로젝트 감지 → OAuth URL 로 안내
async function handleGitHubConnect(interaction: {
  guild_id?: string
  channel_id?: string
  data?: {
    options?: {
      name: string
      type: number
      options?: { name: string; value: string }[]
    }[]
  }
}) {
  const channelId = interaction.channel_id

  if (!channelId) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '채널 정보를 찾을 수 없습니다.', flags: EPHEMERAL },
    })
  }

  const supabase = createAdminClient()

  // channel_id → 프로젝트 매핑 조회
  const project = await findProjectByChannel(supabase, channelId)

  if (!project) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: {
        content:
          '이 채널은 프로젝트에 연결되어 있지 않습니다. 팀 채널에서 사용해주세요.',
        flags: EPHEMERAL,
      },
    })
  }

  // club slug 조회 (OAuth URL 에 필요)
  const { data: club } = await supabase
    .from('clubs')
    .select('slug')
    .eq('id', project.club_id)
    .single()

  const clubSlug = club?.slug ?? ''
  const appUrl = APP_URL

  // OAuth URL 생성 — opportunityId 를 포함하여 프로젝트 레벨 연동
  const oauthUrl = `${appUrl}/api/github/oauth?clubId=${project.club_id}&clubSlug=${clubSlug}&opportunityId=${project.opportunity_id}`

  return NextResponse.json({
    type: CHANNEL_MESSAGE,
    data: {
      content:
        '아래 버튼을 클릭하여 GitHub 계정을 연결하세요.\n레포 선택과 알림 채널 설정은 웹에서 진행됩니다.',
      flags: EPHEMERAL,
      components: [
        {
          type: 1, // ACTION_ROW
          components: [
            {
              type: 2, // BUTTON
              style: 5, // LINK — 외부 URL 로 이동
              label: 'GitHub 연결하기',
              url: oauthUrl,
            },
          ],
        },
      ],
    },
  })
}

// ── /github 목록 — 현재 프로젝트에 연결된 레포 목록 ──
async function handleGitHubList(interaction: {
  guild_id?: string
  channel_id?: string
}) {
  const channelId = interaction.channel_id

  if (!channelId) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '채널 정보를 찾을 수 없습니다.', flags: EPHEMERAL },
    })
  }

  const supabase = createAdminClient()

  // channel_id → 프로젝트 매핑 조회
  const project = await findProjectByChannel(supabase, channelId)

  if (!project || !project.opportunity_id) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: {
        content:
          '이 채널은 프로젝트에 연결되어 있지 않습니다. 팀 채널에서 사용해주세요.',
        flags: EPHEMERAL,
      },
    })
  }

  // 이 프로젝트에 연결된 GitHub 레포만 조회
  const { data: connectors } = await supabase
    .from('club_harness_connectors')
    .select('display_name, enabled, created_at, credentials')
    .eq('club_id', project.club_id)
    .eq('connector_type', 'github')
    .eq('opportunity_id', project.opportunity_id)
    .order('created_at', { ascending: true })

  if (!connectors || connectors.length === 0) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: {
        content:
          '이 프로젝트에 연결된 GitHub 레포가 없습니다.\n`/github 연결`로 GitHub을 연결해주세요.',
        flags: EPHEMERAL,
      },
    })
  }

  const list = connectors
    .map((c, i) => {
      const status = c.enabled ? '🟢' : '⏸️'
      const creds = c.credentials as Record<string, unknown> | null
      const repo = creds?.repo ?? c.display_name ?? '(알 수 없음)'
      return `${i + 1}. ${status} **${repo}**`
    })
    .join('\n')

  return NextResponse.json({
    type: CHANNEL_MESSAGE,
    data: {
      content: `**이 프로젝트에 연결된 GitHub 레포 (${connectors.length}개)**\n\n${list}`,
      flags: EPHEMERAL,
    },
  })
}

// ── /github 해제 repo — 현재 프로젝트에서 레포 연결 해제 ──
// channel_id → 프로젝트 감지 → opportunity_id + display_name 으로 삭제
// credentials 에 webhookId, accessToken 이 있으면 GitHub webhook 도 삭제 시도 (best-effort)
async function handleGitHubDisconnect(interaction: {
  guild_id?: string
  channel_id?: string
  data?: {
    options?: {
      name: string
      type: number
      options?: { name: string; value: string }[]
    }[]
  }
}) {
  const channelId = interaction.channel_id
  const repo = interaction.data?.options?.[0]?.options?.find((o) => o.name === 'repo')?.value

  if (!channelId) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '채널 정보를 찾을 수 없습니다.', flags: EPHEMERAL },
    })
  }

  if (!repo) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: {
        content: '해제할 레포 이름을 입력해주세요. (예: `owner/repo-name`)',
        flags: EPHEMERAL,
      },
    })
  }

  const supabase = createAdminClient()

  // channel_id → 프로젝트 매핑 조회
  const project = await findProjectByChannel(supabase, channelId)

  if (!project || !project.opportunity_id) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: {
        content:
          '이 채널은 프로젝트에 연결되어 있지 않습니다. 팀 채널에서 사용해주세요.',
        flags: EPHEMERAL,
      },
    })
  }

  // 해당 프로젝트에서 레포 찾기 (display_name 또는 credentials.repo 로 매칭)
  const { data: connector } = await supabase
    .from('club_harness_connectors')
    .select('id, credentials')
    .eq('club_id', project.club_id)
    .eq('connector_type', 'github')
    .eq('opportunity_id', project.opportunity_id)
    .eq('display_name', repo)
    .maybeSingle()

  if (!connector) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: {
        content: `이 프로젝트에서 **${repo}** 레포를 찾을 수 없습니다.\n\`/github 목록\`으로 연결된 레포를 확인해주세요.`,
        flags: EPHEMERAL,
      },
    })
  }

  // GitHub webhook 삭제 시도 (best-effort)
  // credentials 에 webhookId, accessToken 이 있는 경우에만 시도
  const creds = connector.credentials as Record<string, unknown> | null
  const webhookId = creds?.webhookId as string | undefined
  const accessToken = creds?.accessToken as string | undefined

  if (webhookId && accessToken && repo.includes('/')) {
    const [owner, repoName] = repo.split('/')
    try {
      const deleteRes = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/hooks/${webhookId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
          signal: AbortSignal.timeout(10_000),
        }
      )

      if (deleteRes.ok || deleteRes.status === 404) {
        console.log(`[GitHub] webhook 삭제 완료: ${repo}`)
      } else {
        console.warn(`[GitHub] webhook 삭제 실패 (${deleteRes.status}), DB 는 정리 진행`)
      }
    } catch (err) {
      console.warn('[GitHub] webhook 삭제 중 에러 (무시):', err)
    }
  }

  // DB 레코드 삭제
  const { error } = await supabase
    .from('club_harness_connectors')
    .delete()
    .eq('id', connector.id)

  if (error) {
    console.error('[GitHub] connector 삭제 실패:', error.message)
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: {
        content: '삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        flags: EPHEMERAL,
      },
    })
  }

  return NextResponse.json({
    type: CHANNEL_MESSAGE,
    data: {
      content: `**${repo}** 연결을 해제했습니다.`,
      flags: EPHEMERAL,
    },
  })
}

// ── /github 내계정 username — GitHub 계정을 Draft 프로필에 연결 ──
async function handleGitHubAccount(interaction: {
  member?: { user?: { id: string } }
  user?: { id: string }
  data?: {
    options?: {
      name: string
      type: number
      options?: { name: string; value: string }[]
    }[]
  }
}) {
  const discordUserId = interaction.member?.user?.id ?? interaction.user?.id
  const rawUsername = interaction.data?.options?.[0]?.options?.find(
    (o) => o.name === 'username'
  )?.value

  if (!discordUserId) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '유저 정보를 찾을 수 없습니다.', flags: EPHEMERAL },
    })
  }

  if (!rawUsername) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: 'GitHub 사용자명을 입력해주세요.', flags: EPHEMERAL },
    })
  }

  // 사용자명 정규화: @ 제거, URL 에서 추출, 소문자 변환
  let username = rawUsername.trim().toLowerCase()
  if (username.startsWith('@')) {
    username = username.slice(1)
  }
  // https://github.com/username 형태에서 username 추출
  const githubUrlMatch = username.match(/github\.com\/([a-zA-Z0-9_-]+)/i)
  if (githubUrlMatch) {
    username = githubUrlMatch[1].toLowerCase()
  }

  const githubUrl = `https://github.com/${username}`

  const supabase = createAdminClient()

  // discord_user_id 로 프로필 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, nickname')
    .eq('discord_user_id', discordUserId)
    .maybeSingle()

  if (!profile) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: {
        content:
          'Draft 계정이 연결되어 있지 않습니다.\n먼저 `/연결` 명령으로 Draft 계정을 연결해주세요.',
        flags: EPHEMERAL,
      },
    })
  }

  // github_url + github_username 동시 업데이트
  // github_url: 프로필 표시용 (전체 URL)
  // github_username: webhook pusher 매칭용 (소문자 username 만)
  const { error } = await supabase
    .from('profiles')
    .update({ github_url: githubUrl, github_username: username })
    .eq('user_id', profile.user_id)

  if (error) {
    console.error('[GitHub] github_url 업데이트 실패:', error.message)
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: {
        content: '저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        flags: EPHEMERAL,
      },
    })
  }

  return NextResponse.json({
    type: CHANNEL_MESSAGE,
    data: {
      content: `GitHub 계정 **${username}**을(를) Draft 프로필에 연결했습니다.`,
      flags: EPHEMERAL,
    },
  })
}
