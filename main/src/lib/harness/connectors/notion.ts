/**
 * Notion 커넥터
 *
 * Notion 데이터베이스/페이지에서 이번 주 변경사항 수집:
 * - 데이터베이스: 행 상태 변경 (칸반 보드 등)
 * - 페이지: 최근 편집된 페이지 목록
 *
 * 세팅: Notion Integration 생성 → 페이지에 공유 → 토큰 입력
 */

import type { HarnessData, Activity, TaskItem, MetricItem } from '../types';

const NOTION_API = 'https://api.notion.com/v1';

/** Notion URL에서 page/database ID 추출 */
function extractNotionId(url: string): string | null {
  // notion.so/xxx/Page-Title-abc123def456
  // 마지막 32자리 hex가 ID
  const match = url.match(/([a-f0-9]{32})(?:\?|$)/);
  if (match) return match[1];
  // 하이픈 포함 UUID 형식
  const uuidMatch = url.match(
    /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/
  );
  return uuidMatch ? uuidMatch[1].replace(/-/g, '') : null;
}

/** Notion ID를 UUID 형식으로 변환 */
function toUuid(id: string): string {
  const clean = id.replace(/-/g, '');
  return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20)}`;
}

async function notionFetch<T>(
  path: string,
  token: string,
  method = 'GET',
  body?: any
): Promise<T | null> {
  try {
    const res = await fetch(`${NOTION_API}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

/** Notion 리치텍스트에서 plain text 추출 */
function richTextToPlain(richText: any[]): string {
  if (!richText) return '';
  return richText.map((t: any) => t.plain_text ?? '').join('');
}

/** Notion 속성에서 상태 추출 */
function extractStatus(prop: any): TaskItem['status'] {
  if (!prop) return 'todo';
  const value =
    prop.status?.name ?? prop.select?.name ?? prop.checkbox ?? '';

  if (typeof value === 'boolean') return value ? 'done' : 'todo';

  const v = String(value).toLowerCase();
  if (['done', '완료', 'complete', 'closed'].some((k) => v.includes(k)))
    return 'done';
  if (['progress', '진행', 'doing', 'wip', 'in review'].some((k) => v.includes(k)))
    return 'in_progress';
  return 'todo';
}

export async function fetchNotion(
  pageUrl: string,
  integrationToken: string
): Promise<HarnessData> {
  const notionId = extractNotionId(pageUrl);
  if (!notionId) {
    return {
      source: 'notion',
      fetchedAt: new Date(),
      ok: false,
      error: '유효하지 않은 Notion URL',
    };
  }

  const uuid = toUuid(notionId);

  try {
    // 데이터베이스인지 페이지인지 먼저 확인
    const dbResult = await notionFetch<any>(
      `/databases/${uuid}/query`,
      integrationToken,
      'POST',
      {
        sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
        page_size: 30,
      }
    );

    if (dbResult && dbResult.results) {
      // 데이터베이스 (칸반/테이블)
      return parseNotionDatabase(dbResult.results);
    }

    // 페이지의 자식 블록 조회
    const blocks = await notionFetch<any>(
      `/blocks/${uuid}/children?page_size=50`,
      integrationToken
    );

    if (blocks && blocks.results) {
      return parseNotionPage(blocks.results);
    }

    return {
      source: 'notion',
      fetchedAt: new Date(),
      ok: false,
      error: 'Notion 페이지를 읽을 수 없습니다. Integration이 공유되었는지 확인해주세요.',
    };
  } catch (err: any) {
    return {
      source: 'notion',
      fetchedAt: new Date(),
      ok: false,
      error: err.message,
    };
  }
}

function parseNotionDatabase(results: any[]): HarnessData {
  const tasks: TaskItem[] = [];
  const activities: Activity[] = [];
  const since = new Date();
  since.setDate(since.getDate() - 7);

  for (const page of results) {
    const props = page.properties ?? {};
    const lastEdited = new Date(page.last_edited_time);

    // 제목 추출 (title 타입 속성 찾기)
    let title = '';
    let assignee = '미정';
    let status: TaskItem['status'] = 'todo';
    let deadline: string | undefined;

    for (const [key, prop] of Object.entries(props) as [string, any][]) {
      if (prop.type === 'title') {
        title = richTextToPlain(prop.title);
      }
      if (prop.type === 'people' && prop.people?.length > 0) {
        assignee = prop.people[0].name ?? prop.people[0].id;
      }
      if (
        prop.type === 'status' ||
        prop.type === 'select' ||
        prop.type === 'checkbox'
      ) {
        if (
          key.toLowerCase().includes('상태') ||
          key.toLowerCase().includes('status')
        ) {
          status = extractStatus(prop);
        }
      }
      if (prop.type === 'date' && prop.date?.start) {
        deadline = prop.date.start;
      }
    }

    if (title) {
      tasks.push({ assignee, title, status, deadline });
    }

    // 이번 주 수정된 항목 → 활동
    if (lastEdited > since) {
      activities.push({
        who: assignee,
        what: `${title} (${status})`,
        when: lastEdited,
      });
    }
  }

  const done = tasks.filter((t) => t.status === 'done').length;
  const metrics: MetricItem[] = [
    { label: '전체 항목', value: tasks.length, unit: 'items' },
    { label: '완료', value: done, unit: 'items' },
    { label: '이번 주 업데이트', value: activities.length, unit: 'edits' },
  ];

  return {
    source: 'notion',
    fetchedAt: new Date(),
    ok: true,
    tasks: tasks.length > 0 ? tasks : undefined,
    activities: activities.length > 0 ? activities : undefined,
    metrics,
  };
}

function parseNotionPage(blocks: any[]): HarnessData {
  const activities: Activity[] = [];

  for (const block of blocks) {
    const text = block[block.type]?.rich_text
      ? richTextToPlain(block[block.type].rich_text)
      : '';
    if (text.trim()) {
      activities.push({
        who: 'page',
        what: text.substring(0, 200),
        when: new Date(block.last_edited_time),
      });
    }
  }

  return {
    source: 'notion',
    fetchedAt: new Date(),
    ok: true,
    activities: activities.length > 0 ? activities : undefined,
    metrics: [{ label: '블록 수', value: blocks.length, unit: 'blocks' }],
  };
}
