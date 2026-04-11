/**
 * Figma 커넥터
 *
 * Figma 파일의 이번 주 활동 수집:
 * - 파일 버전 히스토리 (누가 언제 수정했는지)
 * - 코멘트 (디자인 피드백)
 *
 * 세팅: Figma Personal Access Token + 파일 URL
 */

import type { HarnessData, Activity, ResourceItem, MetricItem } from '../types';

const FIGMA_API = 'https://api.figma.com/v1';

/** Figma URL에서 file key 추출 */
function extractFileKey(url: string): string | null {
  const match = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

async function figmaFetch<T>(
  path: string,
  token: string
): Promise<T | null> {
  try {
    const res = await fetch(`${FIGMA_API}${path}`, {
      headers: { 'X-Figma-Token': token },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export async function fetchFigma(
  fileUrl: string,
  accessToken: string
): Promise<HarnessData> {
  const fileKey = extractFileKey(fileUrl);
  if (!fileKey) {
    return {
      source: 'figma',
      fetchedAt: new Date(),
      ok: false,
      error: '유효하지 않은 Figma URL',
    };
  }

  try {
    // 병렬로 버전 히스토리 + 코멘트 수집
    const [versions, comments] = await Promise.all([
      figmaFetch<any>(`/files/${fileKey}/versions`, accessToken),
      figmaFetch<any>(`/files/${fileKey}/comments`, accessToken),
    ]);

    const since = new Date();
    since.setDate(since.getDate() - 7);

    const activities: Activity[] = [];
    const resources: ResourceItem[] = [];
    const metrics: MetricItem[] = [];

    // 버전 히스토리 → 활동
    if (versions?.versions) {
      const recentVersions = versions.versions.filter(
        (v: any) => new Date(v.created_at) > since
      );

      for (const v of recentVersions) {
        activities.push({
          who: v.user?.handle ?? 'unknown',
          what: v.label || '디자인 수정',
          when: new Date(v.created_at),
        });
      }

      metrics.push({
        label: '이번 주 디자인 수정',
        value: recentVersions.length,
        unit: 'versions',
      });
    }

    // 코멘트 → 활동 + 리소스(스레드 링크)
    if (comments?.comments) {
      const recentComments = comments.comments.filter(
        (c: any) => new Date(c.created_at) > since && !c.resolved_at
      );

      for (const c of recentComments) {
        activities.push({
          who: c.user?.handle ?? 'unknown',
          what: `💬 ${c.message?.substring(0, 100) ?? '코멘트'}`,
          when: new Date(c.created_at),
        });
      }

      const resolved = comments.comments.filter(
        (c: any) =>
          c.resolved_at && new Date(c.resolved_at) > since
      ).length;

      metrics.push(
        { label: '새 코멘트', value: recentComments.length, unit: 'comments' },
        { label: '해결된 코멘트', value: resolved, unit: 'comments' }
      );
    }

    // 파일 자체를 리소스로 등록
    resources.push({
      url: fileUrl,
      label: 'Figma 디자인 파일',
      sharedBy: 'figma',
      type: 'design',
    });

    return {
      source: 'figma',
      fetchedAt: new Date(),
      ok: true,
      activities: activities.length > 0 ? activities : undefined,
      resources,
      metrics,
    };
  } catch (err: any) {
    return {
      source: 'figma',
      fetchedAt: new Date(),
      ok: false,
      error: err.message,
    };
  }
}
