/**
 * GitHub Webhook 수신 → DB 저장 + AI 요약 + Discord 알림
 *
 * GitHub에서 push, PR, issue 이벤트 발생 시:
 * 1. X-Hub-Signature-256 서명 검증
 *    - 먼저 club_harness_connectors에서 레포별 webhookSecret으로 검증 시도
 *    - 없으면 환경변수 GITHUB_WEBHOOK_SECRET으로 fallback (수동 webhook 호환)
 * 2. push 이벤트: github_events 테이블에 raw 저장
 * 3. sender.login(GitHub 계정명) → Draft 유저 매핑 시도
 * 4. AI 요약 생성 (Gemini Flash-Lite)
 * 5. Discord 채널에 알림 포스팅
 *
 * 설정 방법:
 * - 자동: /api/github/repos/connect에서 webhook 자동 생성 (레포별 secret)
 * - 수동: GitHub repo Settings > Webhooks > Add webhook (환경변수 secret)
 */

import { NextRequest, NextResponse, after } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { sendChannelMessage } from '@/src/lib/discord/client'
import crypto from 'crypto'

export const runtime = 'nodejs'

// ── 서명 검증 ──

function verifySignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature) return false
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

// ── Discord mention 이스케이프 ──
// @everyone, @here를 zero-width space로 무효화한다.
// 외부 입력(커밋 메시지, PR 제목 등)이 Discord mention을 트리거하는 것을 방지.
function sanitizeForDiscord(text: string): string {
  return text
    .replace(/@everyone/g, '@\u200Beveryone')
    .replace(/@here/g, '@\u200Bhere')
}

// ── AI 요약 생성 ──

/**
 * 커밋 목록을 자연어로 요약한다.
 * Gemini Flash-Lite 사용 — 비용 극히 저렴 (클럽당 월 $0.05 수준).
 * 실패 시 null 반환 (AI 요약은 optional이므로 전체 플로우를 멈추지 않는다)
 */
async function generateCommitSummary(
  commits: { message: string; id: string; added?: string[]; modified?: string[]; removed?: string[] }[],
  repoName: string,
  branch: string,
  pusherName: string
): Promise<string | null> {
  try {
    const { chatModel } = await import('@/src/lib/ai/gemini-client')

    const commitInfo = commits
      .slice(0, 10)
      .map(c => {
        const files = [
          ...(c.added || []).map(f => `+${f}`),
          ...(c.modified || []).map(f => `~${f}`),
          ...(c.removed || []).map(f => `-${f}`),
        ].slice(0, 5).join(', ')
        return `- ${c.message.split('\n')[0]}${files ? ` (${files})` : ''}`
      })
      .join('\n')

    const result = await chatModel.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: `다음은 ${repoName} 리포지토리의 ${branch} 브랜치에 ${pusherName}이(가) push한 커밋 목록입니다:\n\n${commitInfo}\n\n이 변경사항을 한국어로 1~2문장으로 간결하게 요약해주세요. 기술적 세부사항보다는 "무엇을 했는지"에 집중하세요.`
        }]
      }],
      systemInstruction: '당신은 개발 팀의 활동을 비개발자도 이해할 수 있도록 요약하는 도우미입니다. 합쇼체를 사용하세요. 이모지는 사용하지 마세요. 마크다운도 사용하지 마세요. 순수 텍스트만 반환하세요.',
      generationConfig: { temperature: 0.3, maxOutputTokens: 200 },
    })

    const summary = result.response.text().trim()
    return summary || null
  } catch (err) {
    console.error('[github-webhook] AI 요약 생성 실패:', err)
    return null
  }
}

// ── Pusher → Draft 유저 매핑 ──

/**
 * GitHub username으로 Draft 유저를 찾는다.
 * profiles.github_username에서 매칭 → club_members에서 해당 클럽의 멤버인지 확인
 *
 * 매칭 실패는 정상적인 상황 (아직 github_username 미등록).
 * 에러를 throw하지 않고 null 반환한다.
 */
async function findDraftMember(
  admin: ReturnType<typeof createAdminClient>,
  githubUsername: string,
  clubId: string
): Promise<{ memberId: string; nickname: string } | null> {
  try {
    // 1. github_username으로 profiles 조회 (대소문자 무시)
    // GitHub username은 case-insensitive이므로 소문자 비교
    const { data: profile } = await admin
      .from('profiles')
      .select('user_id, nickname')
      .ilike('github_username', githubUsername)
      .maybeSingle()

    if (!profile) return null

    // 2. 해당 유저가 이 클럽의 멤버인지 확인
    const { data: member } = await admin
      .from('club_members')
      .select('id')
      .eq('club_id', clubId)
      .eq('user_id', profile.user_id)
      .eq('status', 'active')
      .maybeSingle()

    if (!member) return null

    return { memberId: member.id, nickname: profile.nickname }
  } catch (err) {
    console.error('[github-webhook] 유저 매핑 실패:', err)
    return null
  }
}

// ── 레포별 webhook secret 조회 ──

/**
 * club_harness_connectors에서 레포에 해당하는 webhookSecret을 찾는다.
 * /api/github/repos/connect에서 자동 생성한 webhook은 레포별 고유 secret을 가짐.
 *
 * 찾지 못하면 null → 환경변수 GITHUB_WEBHOOK_SECRET으로 fallback.
 * 이 2단계 검증 방식으로 자동 webhook과 수동 webhook 모두 지원한다.
 */
async function findWebhookSecretByRepo(
  admin: ReturnType<typeof createAdminClient>,
  repoFullName: string
): Promise<string | null> {
  try {
    const { data: connector } = await admin
      .from('club_harness_connectors')
      .select('credentials')
      .eq('connector_type', 'github')
      .eq('enabled', true)
      .filter('credentials->>repo', 'eq', repoFullName)
      .maybeSingle()

    if (!connector) return null
    const creds = connector.credentials as any
    return creds?.webhookSecret ?? null
  } catch (err) {
    console.error('[github-webhook] webhookSecret 조회 실패:', err)
    return null
  }
}

// ── repo → club 매핑 ──

/**
 * GitHub 리포지토리를 Draft 클럽에 매핑한다.
 * club_harness_connectors 테이블에서 connector_type='github'인 행을 찾는다.
 * credentials JSONB에 { repo: "owner/repo" } 형태로 저장되어 있어야 한다.
 *
 * 매핑이 없으면 null (아직 연동 미설정 → Discord fallback 채널로만 전송)
 */
async function findClubByRepo(
  admin: ReturnType<typeof createAdminClient>,
  repoFullName: string
): Promise<{ clubId: string; opportunityId: string | null; discordChannelId: string | null } | null> {
  try {
    // harness_connectors에서 github 타입 + repo 매칭
    const { data: connector } = await admin
      .from('club_harness_connectors')
      .select('club_id, opportunity_id')
      .eq('connector_type', 'github')
      .eq('enabled', true)
      .filter('credentials->>repo', 'eq', repoFullName)
      .maybeSingle()

    if (!connector) return null

    // 해당 클럽의 Discord 알림 채널 조회
    // discord_bot_installations → guild_id 확보 후, 환경변수 또는 팀채널에서 채널 찾기
    let discordChannelId: string | null = null

    if (connector.opportunity_id) {
      // 프로젝트에 연결된 Discord 팀 채널이 있는지 확인
      const { data: teamChannel } = await admin
        .from('discord_team_channels')
        .select('discord_channel_id')
        .eq('club_id', connector.club_id)
        .eq('opportunity_id', connector.opportunity_id)
        .maybeSingle()

      discordChannelId = teamChannel?.discord_channel_id ?? null
    }

    return {
      clubId: connector.club_id,
      opportunityId: connector.opportunity_id ?? null,
      discordChannelId,
    }
  } catch (err) {
    console.error('[github-webhook] club 매핑 조회 실패:', err)
    return null
  }
}

// ── Discord 메시지 포맷 ──

function formatPushMessage(
  payload: Record<string, any>,
  draftNickname: string | null,
  aiSummary: string | null
): string {
  const commits = payload.commits || []
  const branch = (payload.ref?.replace('refs/heads/', '') || 'unknown') as string
  const pusher = draftNickname || payload.pusher?.name || 'unknown'
  const repoName = payload.repository?.name || 'unknown'

  const commitLines = commits
    .slice(0, 5)
    .map((c: { message: string; id: string }) =>
      `  \`${c.id.slice(0, 7)}\` ${sanitizeForDiscord(c.message.split('\n')[0])}`
    )
    .join('\n')
  const moreText = commits.length > 5 ? `\n  ... +${commits.length - 5}개 커밋` : ''

  let message = `**${sanitizeForDiscord(repoName)}** / \`${branch}\` — ${sanitizeForDiscord(pusher)}님이 ${commits.length}개 커밋을 push했습니다\n${commitLines}${moreText}`

  if (aiSummary) {
    message += `\n\n> ${aiSummary}`
  }

  return message
}

function formatPRMessage(payload: Record<string, any>): string | null {
  const pr = payload.pull_request
  const action = payload.action
  if (!pr) return null

  // merged는 action='closed' + pr.merged=true
  const isMerged = action === 'closed' && pr.merged
  if (!['opened', 'closed'].includes(action) && !isMerged) return null

  const emoji = isMerged ? '🟣' : action === 'opened' ? '🟢' : '🔴'
  const status = isMerged ? 'Merged' : action === 'opened' ? 'Opened' : 'Closed'
  return `**${emoji} PR ${status}** — #${pr.number} ${sanitizeForDiscord(pr.title)}\nby ${sanitizeForDiscord(pr.user?.login || 'unknown')}\n${pr.html_url}`
}

function formatIssueMessage(payload: Record<string, any>): string | null {
  const issue = payload.issue
  const action = payload.action
  if (!issue || !['opened', 'closed'].includes(action)) return null

  const emoji = action === 'opened' ? '🟡' : '✅'
  return `**${emoji} Issue ${action}** — #${issue.number} ${sanitizeForDiscord(issue.title)}\n${issue.html_url}`
}

// ── 메인 핸들러 ──

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. 서명 검증 (HMAC SHA-256)
  // 2단계 검증: 레포별 webhookSecret → 환경변수 GITHUB_WEBHOOK_SECRET fallback
  // 레포별 secret은 /api/github/repos/connect에서 자동 생성된 webhook용,
  // 환경변수 secret은 수동으로 설정한 기존 webhook 호환용.
  const signature = request.headers.get('x-hub-signature-256')
  const body = await request.text()

  const event = request.headers.get('x-github-event')

  // JSON.parse 실패 시 400 반환 (잘못된 payload 방어)
  let payload: Record<string, any>
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const repoFullName = payload.repository?.full_name as string | undefined
  if (!repoFullName) {
    return NextResponse.json({ ok: true, skipped: 'no repository' })
  }

  const admin = createAdminClient()

  // 서명 검증: 먼저 레포별 webhookSecret으로 시도
  let signatureValid = false
  const repoSecret = await findWebhookSecretByRepo(admin, repoFullName)
  if (repoSecret) {
    signatureValid = verifySignature(body, signature, repoSecret)
  }

  // 레포별 secret으로 검증 실패 → 환경변수 fallback
  if (!signatureValid) {
    const globalSecret = process.env.GITHUB_WEBHOOK_SECRET
    if (globalSecret) {
      signatureValid = verifySignature(body, signature, globalSecret)
    }
  }

  if (!signatureValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // 2. repo → club 매핑
  const clubMapping = await findClubByRepo(admin, repoFullName)

  // fallback 채널: 매핑이 없어도 환경변수로 최소한 Discord에는 전송
  const discordChannelId = clubMapping?.discordChannelId
    || process.env.DISCORD_DEV_FEED_CHANNEL_ID

  // 3. 이벤트별 처리
  if (event === 'push') {
    const commits = payload.commits || []
    if (commits.length === 0) {
      return NextResponse.json({ ok: true, skipped: 'empty push' })
    }

    const branch = (payload.ref?.replace('refs/heads/', '') || 'unknown') as string
    // sender.login = GitHub 계정명 (API 인증 기준, 유저 매핑에 사용)
    // pusher.name = Git 설정의 표시 이름 (Discord 메시지 표시용)
    const senderLogin = (payload.sender?.login || '') as string
    const pusherName = (payload.pusher?.name || senderLogin || 'unknown') as string

    // sender.login → Draft 유저 매핑 (클럽이 매핑된 경우만)
    // pusher.name은 git config의 이름이라 GitHub 계정명과 다를 수 있으므로
    // API 기반의 sender.login을 매핑에 사용한다.
    let draftMember: { memberId: string; nickname: string } | null = null
    if (clubMapping && senderLogin) {
      draftMember = await findDraftMember(admin, senderLogin, clubMapping.clubId)
    }

    // github_events에 raw 저장 (클럽 매핑이 있는 경우만)
    let eventId: string | null = null
    if (clubMapping) {
      const { data: inserted, error: insertError } = await admin
        .from('github_events')
        .insert({
          club_id: clubMapping.clubId,
          project_id: clubMapping.opportunityId,
          pusher_github_username: senderLogin || pusherName,
          pusher_member_id: draftMember?.memberId ?? null,
          repo_name: repoFullName,
          branch,
          commits: commits satisfies unknown[],
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('[github-webhook] github_events INSERT 실패:', insertError)
      }
      eventId = inserted?.id ?? null
    }

    // AI 요약 + Discord 전송은 after()로 비동기 처리
    // 이유: 서명 검증 + DB 저장까지는 동기로 확실히 하고,
    // AI 호출은 느릴 수 있으므로 GitHub 측에 200을 먼저 반환한다.
    if (discordChannelId) {
      after(async () => {
        try {
          // AI 요약 생성
          const aiSummary = await generateCommitSummary(commits, repoFullName, branch, pusherName)

          // Discord 메시지 전송
          const message = formatPushMessage(payload, draftMember?.nickname ?? null, aiSummary)
          const discordMsg = await sendChannelMessage(discordChannelId!, message)

          // ai_summary + discord_message_id를 한 번의 update로 처리
          // 불필요한 DB 왕복을 줄인다.
          if (eventId) {
            const updatePayload: Record<string, string> = {}
            if (aiSummary) updatePayload.ai_summary = aiSummary
            if (discordMsg?.id) updatePayload.discord_message_id = discordMsg.id

            if (Object.keys(updatePayload).length > 0) {
              const { error: updateError } = await admin
                .from('github_events')
                .update(updatePayload)
                .eq('id', eventId)

              if (updateError) {
                console.error('[github-webhook] github_events UPDATE 실패:', updateError)
              }
            }
          }
        } catch (err) {
          console.error('[github-webhook] 비동기 처리 실패:', err)
        }
      })
    }

    return NextResponse.json({ ok: true, event: 'push', stored: !!eventId })
  }

  // PR / Issue는 기존 로직 유지 (DB 저장 없이 Discord에만 전송)
  let message: string | null = null

  if (event === 'pull_request') {
    message = formatPRMessage(payload)
  } else if (event === 'issues') {
    message = formatIssueMessage(payload)
  }

  if (!message) {
    return NextResponse.json({ ok: true, skipped: `event: ${event}` })
  }

  if (!discordChannelId) {
    return NextResponse.json({ ok: true, skipped: 'no channel mapping' })
  }

  try {
    await sendChannelMessage(discordChannelId, message)
    return NextResponse.json({ ok: true, event, delivered: true })
  } catch (error) {
    console.error('[github-webhook] Discord 전송 실패:', error)
    return NextResponse.json({ ok: true, event, delivered: false })
  }
}
