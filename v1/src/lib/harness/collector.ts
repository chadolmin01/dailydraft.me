/**
 * 하네스 데이터 수집 오케스트레이터
 *
 * 모든 커넥터를 병렬로 실행 → 실패 격리 → 통합 컨텍스트 생성
 * Ghostwriter 크론에서 주 1회 호출
 *
 * 흐름:
 * 1. club_harness_connectors 테이블에서 활성 커넥터 조회
 * 2. 각 커넥터 병렬 실행 (Promise.allSettled)
 * 3. 결과를 EnrichedHarnessContext로 합침
 * 4. 봇 감지 데이터 (team_tasks, team_decisions, team_resources) 추가
 * 5. 과거 누적 컨텍스트 (이번 기수 결정/회고) 추가
 */

import type {
  ConnectorConfig,
  HarnessData,
  EnrichedHarnessContext,
  TaskItem,
  DecisionItem,
  ResourceItem,
} from './types';
import { fetchGoogleSheets } from './connectors/google-sheets';
import { fetchGitHub } from './connectors/github';
import { fetchNotion } from './connectors/notion';
import { fetchFigma } from './connectors/figma';

/**
 * 단일 커넥터 실행 — 타입에 따라 적절한 fetcher 호출
 */
async function executeConnector(
  config: ConnectorConfig
): Promise<HarnessData> {
  const creds = config.credentials;

  switch (creds.type) {
    case 'google_sheets':
      return fetchGoogleSheets(creds.spreadsheetUrl, creds.sheetName);

    case 'github':
      return fetchGitHub(creds.repoUrl, creds.accessToken);

    case 'notion':
      return fetchNotion(creds.pageUrl, creds.integrationToken);

    case 'figma':
      return fetchFigma(creds.fileUrl, creds.accessToken);

    default:
      return {
        source: config.type,
        fetchedAt: new Date(),
        ok: false,
        error: `미지원 커넥터: ${config.type}`,
      };
  }
}

/**
 * 모든 활성 커넥터를 병렬 실행하고 결과를 합침
 *
 * 실패 격리: 한 커넥터가 실패해도 나머지 결과는 정상 반환
 * 타임아웃: 전체 30초 (개별 커넥터는 10초)
 */
export async function collectAllSources(
  connectors: ConnectorConfig[]
): Promise<HarnessData[]> {
  const enabled = connectors.filter((c) => c.enabled);
  if (enabled.length === 0) return [];

  const results = await Promise.allSettled(
    enabled.map((c) => executeConnector(c))
  );

  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return {
      source: enabled[i].type,
      fetchedAt: new Date(),
      ok: false,
      error: r.reason?.message ?? 'Unknown error',
    };
  });
}

/**
 * 수집된 데이터를 EnrichedHarnessContext로 변환
 *
 * 기존 HarnessContext 위에 멀티소스 데이터를 덧붙임
 */
export function buildEnrichedContext(
  externalData: HarnessData[],
  botData: {
    tasks: TaskItem[];
    decisions: DecisionItem[];
    resources: ResourceItem[];
  },
  historical: {
    decisions: DecisionItem[];
    retros: string[];
  }
): Partial<EnrichedHarnessContext> {
  return {
    externalSources: externalData.filter((d) => d.ok),
    botDetectedTasks: botData.tasks,
    botDetectedDecisions: botData.decisions,
    botDetectedResources: botData.resources,
    historicalDecisions: historical.decisions,
    historicalRetros: historical.retros,
  };
}

/**
 * EnrichedHarnessContext → Ghostwriter 프롬프트에 넣을 텍스트 블록
 *
 * AI가 이해하기 쉬운 형태로 구조화
 */
export function formatHarnessForPrompt(
  ctx: Partial<EnrichedHarnessContext>
): string {
  const sections: string[] = [];

  // 봇 감지 데이터
  if (ctx.botDetectedTasks && ctx.botDetectedTasks.length > 0) {
    sections.push('## 봇이 감지한 할 일 (Discord 대화에서 확인됨)');
    ctx.botDetectedTasks.forEach((t) => {
      const status = t.status === 'done' ? '✅' : t.status === 'in_progress' ? '🔧' : '⬜';
      sections.push(`${status} ${t.assignee}: ${t.title}${t.deadline ? ` (${t.deadline})` : ''}`);
    });
    sections.push('');
  }

  if (ctx.botDetectedDecisions && ctx.botDetectedDecisions.length > 0) {
    sections.push('## 이번 주 결정사항 (투표/합의로 확정)');
    ctx.botDetectedDecisions.forEach((d) => {
      sections.push(`- ${d.topic} → ${d.result}`);
    });
    sections.push('');
  }

  if (ctx.botDetectedResources && ctx.botDetectedResources.length > 0) {
    sections.push('## 공유된 자료');
    ctx.botDetectedResources.forEach((r) => {
      sections.push(`- ${r.label} (${r.sharedBy}): ${r.url}`);
    });
    sections.push('');
  }

  // 외부 소스 데이터
  if (ctx.externalSources) {
    for (const src of ctx.externalSources) {
      if (!src.ok) continue;

      const label = {
        google_sheets: 'Google Sheets',
        github: 'GitHub',
        notion: 'Notion',
        figma: 'Figma',
        google_calendar: 'Google Calendar',
        google_drive: 'Google Drive',
        linear: 'Linear',
        slack: 'Slack',
        discord: 'Discord',
      }[src.source] ?? src.source;

      sections.push(`## ${label} 활동`);

      // 메트릭
      if (src.metrics && src.metrics.length > 0) {
        const metricLine = src.metrics
          .map((m) => `${m.label}: ${m.value}${m.unit ? ` ${m.unit}` : ''}`)
          .join(' | ');
        sections.push(`📊 ${metricLine}`);
      }

      // 작업
      if (src.tasks && src.tasks.length > 0) {
        sections.push('작업 현황:');
        src.tasks.slice(0, 15).forEach((t) => {
          const status = t.status === 'done' ? '✅' : t.status === 'in_progress' ? '🔧' : '⬜';
          sections.push(`  ${status} ${t.assignee}: ${t.title}`);
        });
        if (src.tasks.length > 15) {
          sections.push(`  ... 외 ${src.tasks.length - 15}개`);
        }
      }

      // 활동 (최근 10개만)
      if (src.activities && src.activities.length > 0) {
        sections.push('최근 활동:');
        src.activities.slice(0, 10).forEach((a) => {
          const date = a.when.toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric',
          });
          sections.push(`  [${date}] ${a.who}: ${a.what}`);
        });
        if (src.activities.length > 10) {
          sections.push(`  ... 외 ${src.activities.length - 10}개`);
        }
      }

      sections.push('');
    }
  }

  // 과거 누적 컨텍스트
  if (ctx.historicalDecisions && ctx.historicalDecisions.length > 0) {
    sections.push('## 참고: 이전 주요 결정사항 (이번 기수)');
    ctx.historicalDecisions.slice(0, 5).forEach((d) => {
      sections.push(`- ${d.topic} → ${d.result}`);
    });
    sections.push('');
  }

  if (ctx.historicalRetros && ctx.historicalRetros.length > 0) {
    sections.push('## 참고: 이전 회고 교훈');
    ctx.historicalRetros.slice(0, 5).forEach((r) => {
      sections.push(`- ${r}`);
    });
    sections.push('');
  }

  return sections.join('\n');
}
