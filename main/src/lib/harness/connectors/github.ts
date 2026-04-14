/**
 * GitHub 커넥터
 *
 * 두 가지 소스에서 이번 주 활동을 수집:
 * 1. GitHub API 직접 호출 (커밋, PR, 이슈)
 * 2. github_events 테이블 (webhook으로 실시간 저장된 push 데이터 + AI 요약)
 *
 * github_events 데이터는 webhook이 실시간으로 저장하므로 GitHub API 호출보다
 * 더 풍부한 정보(AI 요약, Draft 유저 매핑)를 포함할 수 있다.
 * 두 소스를 합쳐서 ghostwriter에 전달하면 더 정확한 주간 업데이트가 가능.
 *
 * 공개 레포는 토큰 불필요. 비공개는 Fine-grained PAT 필요.
 */

import type { HarnessData, Activity, TaskItem, MetricItem } from '../types';
import type { SupabaseClient } from '@supabase/supabase-js';

const GITHUB_API = 'https://api.github.com';

/** URL에서 owner/repo 추출 */
function extractRepo(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/\s?#]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
}

async function ghFetch<T>(
  path: string,
  token?: string
): Promise<T | null> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${GITHUB_API}${path}`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export async function fetchGitHub(
  repoUrl: string,
  accessToken?: string
): Promise<HarnessData> {
  const repo = extractRepo(repoUrl);
  if (!repo) {
    return {
      source: 'github',
      fetchedAt: new Date(),
      ok: false,
      error: '유효하지 않은 GitHub URL',
    };
  }

  const since = new Date();
  since.setDate(since.getDate() - 7);
  const sinceStr = since.toISOString();

  const token = accessToken || process.env.GITHUB_TOKEN;

  try {
    // 병렬로 커밋, PR, 이슈 수집
    const [commits, prs, issues] = await Promise.all([
      ghFetch<any[]>(
        `/repos/${repo.owner}/${repo.repo}/commits?since=${sinceStr}&per_page=50`,
        token
      ),
      ghFetch<any[]>(
        `/repos/${repo.owner}/${repo.repo}/pulls?state=all&sort=updated&direction=desc&per_page=20`,
        token
      ),
      ghFetch<any[]>(
        `/repos/${repo.owner}/${repo.repo}/issues?state=all&since=${sinceStr}&per_page=20`,
        token
      ),
    ]);

    const activities: Activity[] = [];
    const tasks: TaskItem[] = [];
    const metrics: MetricItem[] = [];

    // 커밋 → 활동
    if (commits && commits.length > 0) {
      for (const c of commits) {
        activities.push({
          who: c.commit?.author?.name ?? c.author?.login ?? 'unknown',
          what: c.commit?.message?.split('\n')[0] ?? '',
          when: new Date(c.commit?.author?.date ?? Date.now()),
          url: c.html_url,
        });
      }
      metrics.push({ label: '이번 주 커밋', value: commits.length, unit: 'commits' });
    }

    // PR → 작업 (열린 PR = in_progress, 머지된 = done)
    if (prs) {
      const recentPrs = prs.filter(
        (pr: any) => new Date(pr.updated_at) > since
      );
      for (const pr of recentPrs) {
        // 이슈가 아닌 PR만 (issues 엔드포인트는 PR도 포함하므로)
        if (!pr.pull_request && pr.pull_request !== undefined) continue;
        tasks.push({
          assignee: pr.user?.login ?? 'unknown',
          title: `PR: ${pr.title}`,
          status: pr.merged_at ? 'done' : pr.state === 'closed' ? 'done' : 'in_progress',
          url: pr.html_url,
        });
      }
      metrics.push({
        label: '활성 PR',
        value: recentPrs.filter((p: any) => p.state === 'open').length,
        unit: 'PRs',
      });
    }

    // 이슈 → 작업
    if (issues) {
      const issueOnly = issues.filter((i: any) => !i.pull_request);
      const recentIssues = issueOnly.filter(
        (i: any) => new Date(i.updated_at) > since
      );
      for (const issue of recentIssues) {
        tasks.push({
          assignee: issue.assignee?.login ?? '미배정',
          title: issue.title,
          status: issue.state === 'closed' ? 'done' : 'todo',
          url: issue.html_url,
        });
      }
      metrics.push({
        label: '활성 이슈',
        value: recentIssues.filter((i: any) => i.state === 'open').length,
        unit: 'issues',
      });
    }

    return {
      source: 'github',
      fetchedAt: new Date(),
      ok: true,
      activities: activities.length > 0 ? activities : undefined,
      tasks: tasks.length > 0 ? tasks : undefined,
      metrics,
    };
  } catch (err: any) {
    return {
      source: 'github',
      fetchedAt: new Date(),
      ok: false,
      error: err.message,
    };
  }
}

/**
 * github_events 테이블에서 이번 주 webhook 데이터를 수집한다.
 *
 * GitHub API 직접 호출(fetchGitHub)과 달리 이 함수는:
 * - webhook으로 실시간 저장된 push 데이터를 사용 (API rate limit 영향 없음)
 * - AI 요약(ai_summary)이 이미 생성되어 있으면 활용
 * - Draft 유저 매핑(pusher_member_id)이 완료된 데이터 사용 가능
 *
 * Ghostwriter 크론에서 호출하여 harness 컨텍스트에 합친다.
 */
export async function fetchGitHubEventsFromDB(
  admin: SupabaseClient,
  clubId: string,
  projectId?: string | null
): Promise<{ activities: Activity[]; summaries: string[]; commitCount: number }> {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  try {
    let query = admin
      .from('github_events')
      .select('pusher_github_username, repo_name, branch, commits, ai_summary, created_at')
      .eq('club_id', clubId)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    // 프로젝트 단위로 필터 (null이면 클럽 전체)
    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data: events, error } = await query

    if (error || !events || events.length === 0) {
      return { activities: [], summaries: [], commitCount: 0 }
    }

    const activities: Activity[] = []
    const summaries: string[] = []
    let totalCommits = 0

    for (const event of events) {
      const commits = (event.commits ?? []) as { message: string; id: string }[]
      totalCommits += commits.length

      // 각 커밋을 활동으로 변환
      for (const c of commits) {
        activities.push({
          who: event.pusher_github_username,
          what: c.message?.split('\n')[0] ?? '',
          when: new Date(event.created_at),
          url: `https://github.com/${event.repo_name}/commit/${c.id}`,
        })
      }

      // AI 요약이 있으면 수집 (ghostwriter 프롬프트에서 추가 컨텍스트로 활용)
      if (event.ai_summary) {
        const repoShort = event.repo_name.split('/')[1] || event.repo_name
        summaries.push(`${repoShort}/${event.branch}: ${event.ai_summary}`)
      }
    }

    return { activities, summaries, commitCount: totalCommits }
  } catch (err) {
    console.error('[github-connector] github_events 조회 실패:', err)
    return { activities: [], summaries: [], commitCount: 0 }
  }
}
