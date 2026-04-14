/**
 * GitHub 레포 목록 API
 *
 * 클럽의 GitHub OAuth connector에서 accessToken을 가져와서
 * 유저가 admin 권한을 가진 레포 목록을 반환한다.
 *
 * GET /api/github/repos?clubId=xxx[&opportunityId=yyy]
 *
 * opportunityId가 있으면 해당 프로젝트에 이미 연결된 레포를 connected=true로 표시.
 * 없으면 클럽 전체에서 연결된 레포를 표시.
 *
 * 응답: { repos: [{ fullName, name, owner, private, url, connected }] }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

export async function GET(req: NextRequest) {
  const clubId = req.nextUrl.searchParams.get('clubId')
  const opportunityId = req.nextUrl.searchParams.get('opportunityId') || null

  if (!clubId) {
    return NextResponse.json({ error: 'clubId is required' }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. 클럽의 GitHub OAuth connector에서 accessToken 가져오기
    // repo가 비어있거나 null인 레코드 = OAuth 연결만 된 상태
    const { data: oauthConnector, error: connectorError } = await supabase
      .from('club_harness_connectors')
      .select('credentials')
      .eq('club_id', clubId)
      .eq('connector_type', 'github')
      .is('opportunity_id', null)
      .single()

    if (connectorError || !oauthConnector) {
      return NextResponse.json(
        { error: 'GitHub이 연결되지 않았습니다. 먼저 GitHub 계정을 연결해주세요.' },
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

    // 2. GitHub API로 레포 목록 조회
    // affiliation=owner,collaborator → 유저가 소유/협업하는 레포
    // sort=pushed → 최근 활동 순
    // per_page=100 → 충분한 양
    const repoRes = await fetch(
      'https://api.github.com/user/repos?affiliation=owner,collaborator&sort=pushed&per_page=100',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        signal: AbortSignal.timeout(10_000),
      }
    )

    if (!repoRes.ok) {
      // 토큰이 revoke 된 경우 401
      if (repoRes.status === 401) {
        return NextResponse.json(
          { error: 'GitHub 토큰이 만료되었습니다. 다시 연결해주세요.' },
          { status: 401 }
        )
      }
      console.error('[GitHub Repos] API 호출 실패:', await repoRes.text())
      return NextResponse.json(
        { error: 'GitHub API 호출에 실패했습니다.' },
        { status: 502 }
      )
    }

    const ghRepos = await repoRes.json()

    // 3. 연결된 레포 목록 조회
    // opportunityId가 있으면 해당 프로젝트에 연결된 레포만 connected=true
    // 없으면 클럽 전체에서 연결된 레포를 표시
    const connectedRepos = new Set<string>()

    if (opportunityId) {
      // 특정 프로젝트에 연결된 레포만 조회
      const { data: projectConnectors } = await supabase
        .from('club_harness_connectors')
        .select('credentials')
        .eq('club_id', clubId)
        .eq('connector_type', 'github')
        .eq('opportunity_id', opportunityId)

      if (projectConnectors) {
        for (const c of projectConnectors) {
          const creds = c.credentials as any
          if (creds?.repo) {
            connectedRepos.add(creds.repo)
          }
        }
      }
    } else {
      // 클럽 전체에서 연결된 레포 조회 (opportunity_id가 있는 것들)
      const { data: connectedConnectors } = await supabase
        .from('club_harness_connectors')
        .select('credentials')
        .eq('club_id', clubId)
        .eq('connector_type', 'github')
        .not('opportunity_id', 'is', null)

      if (connectedConnectors) {
        for (const c of connectedConnectors) {
          const creds = c.credentials as any
          if (creds?.repo) {
            connectedRepos.add(creds.repo)
          }
        }
      }
    }

    // 4. admin 권한이 있는 레포만 필터 (webhook 생성에 필요)
    const repos = ghRepos
      .filter((r: any) => r.permissions?.admin === true)
      .map((r: any) => ({
        fullName: r.full_name,
        name: r.name,
        owner: r.owner?.login,
        private: r.private,
        url: r.html_url,
        description: r.description,
        language: r.language,
        updatedAt: r.pushed_at,
        connected: connectedRepos.has(r.full_name),
      }))

    return NextResponse.json({ repos })
  } catch (err: any) {
    console.error('[GitHub Repos] 오류:', err)
    return NextResponse.json(
      { error: '레포 목록을 불러오는 데 실패했습니다.' },
      { status: 500 }
    )
  }
}
