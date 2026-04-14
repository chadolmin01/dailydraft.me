/**
 * GitHub 레포 연결 해제 API — webhook 삭제 + DB 레코드 삭제
 *
 * POST /api/github/repos/disconnect
 * Body: { clubId, repoFullName, opportunityId? } (예: "owner/repo")
 *
 * 1. club_harness_connectors에서 해당 레포의 connector 조회
 *    - opportunityId가 있으면 해당 프로젝트의 connector만 삭제
 *    - 없으면 repoFullName으로 매칭
 * 2. credentials에서 webhookId, accessToken 추출
 * 3. GitHub API로 webhook 삭제
 * 4. DB 레코드 삭제
 *
 * GitHub webhook 삭제 실패(이미 삭제됨 등)는 무시하고 DB 레코드는 삭제 진행.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

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

    const repoParts = repoFullName.split('/')
    if (repoParts.length !== 2) {
      return NextResponse.json(
        { error: '유효하지 않은 레포 형식입니다.' },
        { status: 400 }
      )
    }

    const [owner, repo] = repoParts
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. 해당 레포의 connector 조회
    // opportunityId가 있으면 해당 프로젝트의 connector만, 없으면 전체에서 검색
    let query = supabase
      .from('club_harness_connectors')
      .select('id, credentials')
      .eq('club_id', clubId)
      .eq('connector_type', 'github')

    if (opportunityId) {
      query = query.eq('opportunity_id', opportunityId)
    }

    const { data: connectors } = await query

    if (!connectors || connectors.length === 0) {
      return NextResponse.json(
        { error: '연결된 GitHub 커넥터를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // repo 이름으로 매칭되는 connector 찾기
    const repoConnector = connectors.find((c) => {
      const creds = c.credentials as any
      return creds?.repo === repoFullName
    })

    if (!repoConnector) {
      return NextResponse.json(
        { error: '해당 레포의 연결 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const credentials = repoConnector.credentials as any
    const webhookId = credentials?.webhookId
    const accessToken = credentials?.accessToken

    // 2. GitHub API로 webhook 삭제 (best-effort)
    // 삭제 실패(이미 삭제됨, 권한 변경 등)는 무시하고 DB는 정리
    if (webhookId && accessToken) {
      try {
        const deleteRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/hooks/${webhookId}`,
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
          // 204 = 성공, 404 = 이미 삭제됨 — 둘 다 OK
          console.log(`[GitHub Disconnect] webhook 삭제 완료: ${repoFullName}`)
        } else {
          console.warn(
            `[GitHub Disconnect] webhook 삭제 실패 (${deleteRes.status}), DB는 정리 진행`
          )
        }
      } catch (err) {
        console.warn('[GitHub Disconnect] webhook 삭제 중 에러 (무시):', err)
      }
    }

    // 3. DB 레코드 삭제
    const { error: deleteError } = await supabase
      .from('club_harness_connectors')
      .delete()
      .eq('id', repoConnector.id)

    if (deleteError) {
      console.error('[GitHub Disconnect] DB 레코드 삭제 실패:', deleteError)
      return NextResponse.json(
        { error: '연결 해제 정보 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log(
      `[GitHub Disconnect] 레포 연결 해제 완료: club=${clubId}, opportunity=${opportunityId || 'none'}, repo=${repoFullName}`
    )

    return NextResponse.json({ ok: true, repo: repoFullName })
  } catch (err: any) {
    console.error('[GitHub Disconnect] 오류:', err)
    return NextResponse.json(
      { error: '레포 연결 해제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
