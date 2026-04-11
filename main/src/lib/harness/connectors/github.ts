/**
 * GitHub 커넥터
 *
 * 공개 레포에서 이번 주 활동을 수집:
 * - 커밋 로그 (누가, 뭘, 언제)
 * - 열린/닫힌 PR
 * - 열린/닫힌 이슈
 *
 * 공개 레포는 토큰 불필요. 비공개는 Fine-grained PAT 필요.
 */

import type { HarnessData, Activity, TaskItem, MetricItem } from '../types';

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
